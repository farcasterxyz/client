import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildContactsUsersFetcher } from './buildContactsUsersFetcher';
import { buildContactsUsersKey } from './buildContactsUsersKey';

const useContactsUsers = () => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildContactsUsersKey(),

    queryFn: buildContactsUsersFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
    }),

    getNextPageParam: getNextPageCursor,
  });
};

export { useContactsUsers };
