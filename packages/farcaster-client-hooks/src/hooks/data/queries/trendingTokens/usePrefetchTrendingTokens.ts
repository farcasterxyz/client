import { useQueryClient } from '@tanstack/react-query';
import { ApiGetTrendingTokensQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedTokens } from '../globallyCachedToken';
import { buildTrendingTokensFetcher } from './buildTrendingTokensFetcher';
import { buildTrendingTokensKey } from './buildTrendingTokensKey';

type TrendingTokensQueryParams = Omit<
  ApiGetTrendingTokensQueryParams,
  'cursor' | 'limit'
> & { limit?: number };

const usePrefetchTrendingTokens = () => {
  const queryClient = useQueryClient();

  const { apiClient } = useFarcasterApiClient();

  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({ params }: { params: TrendingTokensQueryParams }) => {
      const { limit = 25 } = params ?? {};

      const queryKey = buildTrendingTokensKey({ ...params, limit });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,
        queryFn: buildTrendingTokensFetcher({
          apiClient,
          params: { ...params, limit: 25 },
          batchMergeIntoGloballyCachedTokens,
        }),
      });
    },
    [
      apiClient,
      batchMergeIntoGloballyCachedTokens,
      checkIfRecentlyPrefetched,
      queryClient,
    ],
  );
};

export { usePrefetchTrendingTokens };
