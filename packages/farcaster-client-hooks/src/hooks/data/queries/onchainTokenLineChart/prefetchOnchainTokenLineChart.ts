import { QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  ApiGetOnchainTokenLineChartQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../..';
import { buildOnchainTokenLineChartFetcher } from './buildOnchainTokenLineChartFetcher';
import { buildOnchainTokenLineChartKey } from './buildOnchainTokenLineChartKey';
import { defaultOnchainTokenLineChartDefaultQueryParams } from './useOnchainTokenLineChart';

export const prefetchOnchainTokenLineChart = (
  queryClient: QueryClient,
  apiClient: FarcasterApiClient,
  { params }: { params: ApiGetOnchainTokenLineChartQueryParams },
) => {
  return queryClient.prefetchQuery({
    queryKey: buildOnchainTokenLineChartKey(params),
    queryFn: buildOnchainTokenLineChartFetcher({
      apiClient,
      params,
    }),
    ...defaultOnchainTokenLineChartDefaultQueryParams,
  });
};

export const usePrefetchOnchainTokenLineChart = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    (params: ApiGetOnchainTokenLineChartQueryParams) => {
      return prefetchOnchainTokenLineChart(queryClient, apiClient, { params });
    },
    [queryClient, apiClient],
  );
};
