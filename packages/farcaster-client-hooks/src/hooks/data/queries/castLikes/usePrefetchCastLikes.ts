import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser';
import { buildCastLikesFetcher } from './buildCastLikesFetcher';
import { buildCastLikesKey } from './buildCastLikesKey';

const usePrefetchCastLikes = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      castHash,
      shouldSkipIfRecentlyPrefetched,
    }: {
      castHash: string;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildCastLikesKey({ castHash });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,

        queryKey: queryKey,

        queryFn: buildCastLikesFetcher({
          apiClient,
          castHash,
          batchMergeIntoGloballyCachedUsers,
        }),
      });
    },
    [
      checkIfRecentlyPrefetched,
      queryClient,
      apiClient,
      batchMergeIntoGloballyCachedUsers,
    ],
  );
};

export { usePrefetchCastLikes };
