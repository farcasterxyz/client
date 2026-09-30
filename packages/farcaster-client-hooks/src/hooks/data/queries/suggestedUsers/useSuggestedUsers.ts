import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildSuggestedUsersFetcher } from './buildSuggestedUsersFetcher';
import { buildSuggestedUsersKey } from './buildSuggestedUsersKey';

const useSuggestedUsers = ({
  limit,
  randomized,
}: {
  limit?: number;
  randomized: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSuggestedUsersKey({ limit, randomized }),

    queryFn: buildSuggestedUsersFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      limit,
      randomized,
    }),

    getNextPageParam: getNextPageCursor,
  });
};

export { useSuggestedUsers };
