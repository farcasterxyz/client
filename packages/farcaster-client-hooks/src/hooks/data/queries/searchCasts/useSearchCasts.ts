import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildSearchCastsFetcher } from './buildSearchCastsFetcher';
import { buildSearchCastsKey } from './buildSearchCastsKey';
import { defaultLimit } from './shared';

const gcTime = MILLIS_PER_MINUTE;

const useSearchCasts = ({
  limit = defaultLimit,
  q,
}: {
  limit?: number;
  q: string;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchCastsKey({ q, limit }),

    queryFn: buildSearchCastsFetcher({
      q,
      limit,
      apiClient,
      batchMergeIntoGloballyCachedCasts,
    }),

    gcTime,
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

const useSearchCastsWithoutSuspense = ({
  limit = defaultLimit,
  q,
}: {
  limit?: number;
  q: string;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchCastsKey({ q, limit }),

    queryFn: buildSearchCastsFetcher({
      q,
      limit,
      apiClient,
      batchMergeIntoGloballyCachedCasts,
    }),

    gcTime,
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useSearchCasts, useSearchCastsWithoutSuspense };
