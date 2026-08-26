import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildUserLikedCastsFetcher } from './buildUserLikedCastsFetcher';
import { buildUserLikedCastsKey } from './buildUserLikedCastsKey';

const usePrefetchUserLikedCasts = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      fid,
      shouldSkipIfRecentlyPrefetched = true,
    }: {
      fid: number;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildUserLikedCastsKey({ fid });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildUserLikedCastsFetcher({
          apiClient,
          batchMergeIntoGloballyCachedCasts,
          fid,
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

export { usePrefetchUserLikedCasts };
