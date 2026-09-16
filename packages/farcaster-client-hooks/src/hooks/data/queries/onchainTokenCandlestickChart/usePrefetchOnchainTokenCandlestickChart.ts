import { QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  ApiGetOnchainTokenCandlestickChartQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOnchainTokenCandlestickChartFetcher } from './buildOnchainTokenCandlestickChartFetcher';
import { buildOnchainTokenCandlestickChartKey } from './buildOnchainTokenCandlestickChartKey';
import { defaultOnchainTokenCandlestickChartQueryParams } from './onchainTokenCandlestickChartDefaultQueryOptions';

export const prefetchOnchainTokenCandlestickChart = (
  queryClient: QueryClient,
  apiClient: FarcasterApiClient,
  { params }: { params: ApiGetOnchainTokenCandlestickChartQueryParams },
) => {
  return queryClient.prefetchQuery({
    queryKey: buildOnchainTokenCandlestickChartKey(params),
    queryFn: buildOnchainTokenCandlestickChartFetcher({
      apiClient,
      params,
    }),
    ...defaultOnchainTokenCandlestickChartQueryParams,
  });
};

const usePrefetchOnchainTokenCandlestickChart = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const callback = useCallback(
    (params: ApiGetOnchainTokenCandlestickChartQueryParams) =>
      prefetchOnchainTokenCandlestickChart(queryClient, apiClient, { params }),
    [apiClient, queryClient],
  );

  return { prefetchOnchainTokenCandlestickChart: callback };
};

export { usePrefetchOnchainTokenCandlestickChart };
