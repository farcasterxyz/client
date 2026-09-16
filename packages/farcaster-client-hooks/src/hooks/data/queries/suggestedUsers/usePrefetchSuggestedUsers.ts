import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser';
import { buildSuggestedUsersFetcher } from './buildSuggestedUsersFetcher';
import { buildSuggestedUsersKey } from './buildSuggestedUsersKey';
import { defaultLimit } from './shared';

const usePrefetchSuggestedUsers = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  return useCallback(
    async ({
      limit = defaultLimit,
      randomized,
    }: {
      limit?: number;
      randomized: boolean | undefined;
    }) => {
      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: buildSuggestedUsersKey({ limit, randomized }),

        queryFn: buildSuggestedUsersFetcher({
          apiClient,
          batchMergeIntoGloballyCachedUsers,
          limit,
          randomized,
        }),
      });
    },
    [apiClient, batchMergeIntoGloballyCachedUsers, queryClient],
  );
};

export { usePrefetchSuggestedUsers };
