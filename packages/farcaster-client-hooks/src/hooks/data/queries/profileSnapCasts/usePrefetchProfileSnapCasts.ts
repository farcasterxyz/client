import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildProfileSnapCastsFetcher } from './buildProfileSnapCastsFetcher';
import { buildProfileSnapCastsKey } from './buildProfileSnapCastsKey';
import { profileSnapCastsDefaultQueryOptions } from './profileSnapCastsDefaultQueryOptions';

const usePrefetchProfileSnapCasts = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    async ({
      fid,
      shouldSkipIfRecentlyPrefetched = false,
    }: {
      fid: number;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildProfileSnapCastsKey({ fid });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchInfiniteQuery({
        ...profileSnapCastsDefaultQueryOptions,
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildProfileSnapCastsFetcher({
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

export { usePrefetchProfileSnapCasts };
