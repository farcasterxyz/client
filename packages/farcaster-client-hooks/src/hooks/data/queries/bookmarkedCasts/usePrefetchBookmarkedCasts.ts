import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildBookmarkedCastsFetcher } from './buildBookmarkedCastsFetcher';
import { buildBookmarkedCastsKey } from './buildBookmarkedCastsKey';

const usePrefetchBookmarkedCasts = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      shouldSkipIfRecentlyPrefetched,
    }: {
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildBookmarkedCastsKey();

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildBookmarkedCastsFetcher({
          apiClient,
          batchMergeIntoGloballyCachedCasts,
        }),
      });
    },
    [
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      checkIfRecentlyPrefetched,
      queryClient,
    ],
  );
};

export { usePrefetchBookmarkedCasts };
