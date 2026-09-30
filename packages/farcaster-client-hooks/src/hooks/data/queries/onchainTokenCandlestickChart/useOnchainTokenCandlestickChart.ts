import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiChain,
  ApiFid,
  ApiGetOnchainTokenCandlestickChart200Response,
  ApiGetOnchainTokenCandlestickChartQueryParams,
  ApiOnchainTokenCandlestickChart,
  ApiOnchainTokenCandlestickChartPoint,
  ApiOnchainTokenChartResolution,
  ApiWebSocketTokenChartUpdateData,
} from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { UseQueryParameters } from '../types';
import { buildOnchainTokenCandlestickChartFetcher } from './buildOnchainTokenCandlestickChartFetcher';
import { buildOnchainTokenCandlestickChartKey } from './buildOnchainTokenCandlestickChartKey';
import { defaultOnchainTokenCandlestickChartQueryParams } from './onchainTokenCandlestickChartDefaultQueryOptions';

type UseOnchainTokenCandlestickChartParameters = UseQueryParameters<
  ApiGetOnchainTokenCandlestickChart200Response['result']
>;

type GloballyCachedTokenCandlestickChart = {
  chart?: ApiOnchainTokenCandlestickChart;
};

const useOnchainTokenCandlestickChart = ({
  params,
  query,
}: {
  params: ApiGetOnchainTokenCandlestickChartQueryParams;
  query: UseOnchainTokenCandlestickChartParameters;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildOnchainTokenCandlestickChartKey(params),
    queryFn: buildOnchainTokenCandlestickChartFetcher({
      apiClient,
      params,
    }),
    ...defaultOnchainTokenCandlestickChartQueryParams,
    ...query,
  });
};

const resolutionToMillis = (resolution: ApiOnchainTokenChartResolution) => {
  switch (resolution) {
    case 'm1':
      return 60000;
    case 'm5':
      return 300000;
    case 'm15':
      return 900000;
    case 'm30':
      return 1800000;
    case 'h1':
      return 3600000;
    case 'h4':
      return 14400000;
    case 'h12':
      return 43200000;
    case 'd1':
      return 86400000;
    case 'w1':
      return 604800000;
  }
};

const mergePoints = (
  points: ApiOnchainTokenCandlestickChartPoint[],
  newPoints: ApiOnchainTokenCandlestickChartPoint[],
) => {
  //points are sorted by timestamp, so we can just merge them by timestamp
  // if timestamp is matching, replace with new point
  // Should return points array with length of points
  const result: ApiOnchainTokenCandlestickChartPoint[] = [];
  let i = 0; // pointer for points
  let j = 0; // pointer for newPoints

  while (i < points.length && j < newPoints.length) {
    const pointTimestamp = points[i].timestamp;
    const newPointTimestamp = newPoints[j].timestamp;

    if (pointTimestamp === newPointTimestamp) {
      // Timestamps match, replace with new point
      result.push(newPoints[j]);
      i++;
      j++;
    } else if (pointTimestamp < newPointTimestamp) {
      // Old point has earlier timestamp, keep it
      result.push(points[i]);
      i++;
    } else {
      // New point has earlier timestamp, add it
      result.push(newPoints[j]);
      j++;
    }
  }

  // Add remaining points from the original array
  while (i < points.length) {
    result.push(points[i]);
    i++;
  }

  // Add remaining new points
  while (j < newPoints.length) {
    result.push(newPoints[j]);
    j++;
  }

  const sizeDifference = result.length - points.length;
  if (sizeDifference > 0) {
    result.splice(0, sizeDifference);
  }

  return result;
};

const buildMergeIntoGloballyCachedTokenCandlestickChart = (
  queryClient: QueryClient,
) => {
  return ({
    updates,
    chain,
    ca,
    res,
    from,
    to,
    countback,
  }: {
    updates: {
      resolution: ApiOnchainTokenChartResolution;
      points: ApiOnchainTokenCandlestickChartPoint[];
    }[];
    chain: ApiChain;
    ca: string;
    res: ApiOnchainTokenChartResolution;
    from: number;
    to: number;
    countback: number;
  }) => {
    for (const update of updates) {
      const updateResolution = update.resolution;
      if (updateResolution !== res) {
        continue;
      }
      const cacheKey = buildOnchainTokenCandlestickChartKey({
        chain,
        ca,
        res,
        from,
        to,
        countback,
      });
      const cachedChart =
        queryClient.getQueryData<GloballyCachedTokenCandlestickChart>(
          cacheKey,
        )?.chart;

      if (cachedChart) {
        const updatePoints = update.points;
        const oldPoints = cachedChart.points;
        const firstNewPoint = updatePoints[0];
        const firstOldPoint = oldPoints[0];
        const resolutionMillis = resolutionToMillis(updateResolution);
        if (
          firstNewPoint.timestamp - firstOldPoint.timestamp >
          resolutionMillis
        ) {
          // This point is past the current chart time range, so we can't merge it
          continue;
        }
        const points = mergePoints(oldPoints, updatePoints);

        const newChart: ApiOnchainTokenCandlestickChart = merge(
          {},
          cachedChart,
          { points },
        );
        queryClient.setQueryData<GloballyCachedTokenCandlestickChart>(
          cacheKey,
          {
            chart: newChart,
          },
        );
      }
    }
  };
};

export const useMergeIntoGloballyCachedTokenCandlestickChart = () => {
  const queryClient = useQueryClient();
  return useCallback(
    ({
      updates,
      chain,
      ca,
      res,
      from,
      to,
      countback,
    }: {
      updates: ApiWebSocketTokenChartUpdateData;
      chain: ApiChain;
      ca: string;
      fid?: ApiFid;
      res: ApiOnchainTokenChartResolution;
      from: number;
      to: number;
      countback: number;
    }) => {
      const mergeIntoGloballyCachedTokenCandlestickChart =
        buildMergeIntoGloballyCachedTokenCandlestickChart(queryClient);
      mergeIntoGloballyCachedTokenCandlestickChart({
        updates: [
          {
            resolution: res,
            points: updates.bars,
          },
        ],
        chain,
        ca,
        res,
        from,
        to,
        countback,
      });
    },
    [queryClient],
  );
};

export { useOnchainTokenCandlestickChart };
