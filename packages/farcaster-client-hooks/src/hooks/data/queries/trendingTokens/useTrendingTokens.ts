import { useInfiniteQuery } from '@tanstack/react-query';
import { ApiGetTrendingTokensQueryParams } from 'farcaster-client-data';

import {
  MILLIS_PER_MINUTE,
  useBatchMergeIntoGloballyCachedTokens,
} from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTrendingTokensFetcher } from './buildTrendingTokensFetcher';
import { buildTrendingTokensKey } from './buildTrendingTokensKey';

type TrendingTokensQueryParams = Omit<
  ApiGetTrendingTokensQueryParams,
  'cursor' | 'limit'
> & { limit?: number };

export const useTrendingTokens = (params?: TrendingTokensQueryParams) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();
  const { limit = 25 } = params ?? {};

  return useInfiniteQuery({
    queryKey: buildTrendingTokensKey({ ...params, limit }),
    queryFn: ({ pageParam: cursor }) =>
      buildTrendingTokensFetcher({
        apiClient,
        params: { ...params, cursor, limit },
        batchMergeIntoGloballyCachedTokens,
      })(),

    getNextPageParam: (lastPage) => lastPage.next?.cursor || undefined,
    initialPageParam: undefined as string | undefined,

    // Background refresh settings (same as before)
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    // Trending tokens should be relatively fresh
    staleTime: MILLIS_PER_MINUTE * 2,

    retry: false,
  });
};
