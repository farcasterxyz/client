import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildLeastInteractedWithFollowingFetcher } from './buildLeastInteractedWithFollowingFetcher';
import { buildLeastInteractedWithFollowingKey } from './buildLeastInteractedWithFollowingKey';

const useLeastInteractedWithFollowing = () => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildLeastInteractedWithFollowingKey(),

    queryFn: buildLeastInteractedWithFollowingFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
    }),

    getNextPageParam: getNextPageCursor,
  });
};

export { useLeastInteractedWithFollowing };
