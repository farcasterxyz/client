import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import {
  useBatchMergeIntoGloballyCachedCasts,
  useBatchMergeIntoGloballyCachedCastsNoOp,
} from '../globallyCachedCast';
import { buildThreadFetcher } from './buildThreadFetcher';
import { buildThreadKey } from './buildThreadKey';

const usePrefetchThread = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();
  const batchMergeIntoGloballyCachedCastsNoOp =
    useBatchMergeIntoGloballyCachedCastsNoOp();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      castHash,
      shouldSkipIfRecentlyPrefetched,
      shouldAvoidUpdatingGlobalCache,
    }: {
      castHash: string;
      shouldSkipIfRecentlyPrefetched?: boolean;
      shouldAvoidUpdatingGlobalCache?: boolean;
    }) => {
      const queryKey = buildThreadKey({ castHash });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildThreadFetcher({
          apiClient,
          castHash,
          batchMergeIntoGloballyCachedCasts: shouldAvoidUpdatingGlobalCache
            ? batchMergeIntoGloballyCachedCastsNoOp
            : batchMergeIntoGloballyCachedCasts,
        }),
      });
    },
    [
      checkIfRecentlyPrefetched,
      queryClient,
      apiClient,
      batchMergeIntoGloballyCachedCastsNoOp,
      batchMergeIntoGloballyCachedCasts,
    ],
  );
};

export { usePrefetchThread };
