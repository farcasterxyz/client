import { useQueryClient } from '@tanstack/react-query';
import { CastHashPrefix } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import {
  useBatchMergeIntoGloballyCachedCasts,
  useBatchMergeIntoGloballyCachedCastsNoOp,
} from '../globallyCachedCast';
import { buildUserThreadCastsFetcher } from './buildUserThreadCastsFetcher';
import { buildUserThreadCastsKey } from './buildUserThreadCastsKey';

const usePrefetchUserThreadCasts = () => {
  const queryClient = useQueryClient();

  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();
  const batchMergeIntoGloballyCachedCastsNoOp =
    useBatchMergeIntoGloballyCachedCastsNoOp();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      castHashPrefix,
      shouldSkipIfRecentlyPrefetched = false,
      shouldAvoidUpdatingGlobalCache = false,
      username,
    }: {
      castHashPrefix: CastHashPrefix;
      shouldSkipIfRecentlyPrefetched?: boolean;
      shouldAvoidUpdatingGlobalCache?: boolean;
      username: string;
    }) => {
      const queryKey = buildUserThreadCastsKey({ castHashPrefix, username });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildUserThreadCastsFetcher({
          apiClient,
          batchMergeIntoGloballyCachedCasts: shouldAvoidUpdatingGlobalCache
            ? batchMergeIntoGloballyCachedCastsNoOp
            : batchMergeIntoGloballyCachedCasts,
          castHashPrefix,
          username,
        }),
      });
    },
    [
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      batchMergeIntoGloballyCachedCastsNoOp,
      checkIfRecentlyPrefetched,
      queryClient,
    ],
  );
};

export { usePrefetchUserThreadCasts };
