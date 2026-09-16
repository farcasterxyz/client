import { useQueryClient } from '@tanstack/react-query';
import { ApiGetWalletNftsQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletNftsFetcher } from './buildWalletNftsFetcher';
import { buildWalletNftsKey } from './buildWalletNftsKey';

const usePrefetchWalletNfts = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const prefetchWalletNfts = useCallback(
    (params: Omit<ApiGetWalletNftsQueryParams, 'limit'>) => {
      return queryClient.prefetchInfiniteQuery({
        queryKey: buildWalletNftsKey(params),
        queryFn: buildWalletNftsFetcher({
          apiClient,
          params,
        }),
        initialPageParam: undefined,
        staleTime: MILLIS_PER_SECOND * 30,
      });
    },
    [apiClient, queryClient],
  );

  return { prefetchWalletNfts };
};

export { usePrefetchWalletNfts };
