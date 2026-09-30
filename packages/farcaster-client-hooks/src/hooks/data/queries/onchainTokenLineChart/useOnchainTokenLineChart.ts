import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiChain,
  ApiFid,
  ApiGetOnchainTokenLineChart200Response,
  ApiGetOnchainTokenLineChartQueryParams,
  ApiOnchainTokenLineChart,
  ApiOnchainTokenLineChartPoint,
  ApiWebSocketTokenChartUpdateData,
} from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { MILLIS_PER_SECOND } from '../../../../utils';
import { UseQueryParameters } from '../types';
import { buildOnchainTokenLineChartFetcher } from './buildOnchainTokenLineChartFetcher';
import { buildOnchainTokenLineChartKey } from './buildOnchainTokenLineChartKey';

type UseOnchainTokenLineChartParameters = UseQueryParameters<
  ApiGetOnchainTokenLineChart200Response['result']
>;

export const defaultOnchainTokenLineChartDefaultQueryParams = {
  staleTime: 30 * MILLIS_PER_SECOND,
} satisfies UseOnchainTokenLineChartParameters;

type GloballyCachedTokenLineChart = {
  chart?: ApiOnchainTokenLineChart;
};

const mergePoints = (
  points: ApiOnchainTokenLineChartPoint[],
  newPoints: ApiOnchainTokenLineChartPoint[],
) => {
  //points are sorted by timestamp, so we can just merge them by timestamp
  // if timestamp is matching, replace with new point
  // Should return points array with length of points
  const result: ApiOnchainTokenLineChartPoint[] = [];
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
    result.shift();
  }

  return result;
};

const buildMergeIntoGloballyCachedTokenLineChart = (
  queryClient: QueryClient,
) => {
  return ({
    updates,
    chain,
    ca,
    fid,
  }: {
    updates: ApiWebSocketTokenChartUpdateData;
    chain: ApiChain;
    ca: string;
    fid?: ApiFid;
  }) => {
    const period = updates.period;
    const cacheKey = buildOnchainTokenLineChartKey({
      chain,
      ca,
      period,
      fid,
    });
    const cachedChart =
      queryClient.getQueryData<GloballyCachedTokenLineChart>(cacheKey)?.chart;

    if (cachedChart) {
      const newPoints = updates.bars.map((bar) => ({
        timestamp: bar.timestamp,
        price: bar.close,
        volume: bar.volume,
      }));
      const points = mergePoints(cachedChart.points, newPoints);
      const newChart = merge({}, cachedChart, { points });
      queryClient.setQueryData<GloballyCachedTokenLineChart>(cacheKey, {
        chart: newChart as ApiOnchainTokenLineChart,
      });
    }
  };
};

const useOnchainTokenLineChart = ({
  params,
  query,
}: {
  params: ApiGetOnchainTokenLineChartQueryParams;
  query: UseOnchainTokenLineChartParameters;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildOnchainTokenLineChartKey(params),
    queryFn: buildOnchainTokenLineChartFetcher({
      apiClient,
      params,
    }),
    ...defaultOnchainTokenLineChartDefaultQueryParams,
    ...query,
  });
};

export const useMergeIntoGloballyCachedTokenLineChart = () => {
  const queryClient = useQueryClient();
  return useCallback(
    ({
      updates,
      chain,
      ca,
      fid,
    }: {
      updates: ApiWebSocketTokenChartUpdateData;
      chain: ApiChain;
      ca: string;
      fid?: ApiFid;
    }) => {
      const mergeIntoGloballyCachedTokenLineChart =
        buildMergeIntoGloballyCachedTokenLineChart(queryClient);
      mergeIntoGloballyCachedTokenLineChart({ updates, chain, ca, fid });
    },
    [queryClient],
  );
};

export { useOnchainTokenLineChart };
