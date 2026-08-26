import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser';
import { buildFollowersYouKnowFetcher } from './buildFollowersYouKnowFetcher';
import { buildFollowersYouKnowKey } from './buildFollowersYouKnowKey';

const usePrefetchFollowersYouKnow = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      fid,
      limit,
      shouldSkipIfRecentlyPrefetched = false,
    }: {
      fid: number;
      limit: number;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildFollowersYouKnowKey({ fid, limit });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildFollowersYouKnowFetcher({
          apiClient,
          batchMergeIntoGloballyCachedUsers,
          fid,
          limit,
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

export { usePrefetchFollowersYouKnow };
