import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser';
import { buildFollowingFetcher } from './buildFollowingFetcher';
import { buildFollowingKey } from './buildFollowingKey';

const usePrefetchFollowing = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      fid,
      shouldSkipIfRecentlyPrefetched = false,
    }: {
      fid: number;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildFollowingKey({ fid });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildFollowingFetcher({
          apiClient,
          batchMergeIntoGloballyCachedUsers,
          fid,
        }),
      });
    },
    [
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      checkIfRecentlyPrefetched,
      queryClient,
    ],
  );
};

export { usePrefetchFollowing };
