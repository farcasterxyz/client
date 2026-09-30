import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useFlatPaginatedResults } from '../../helpers';
import { buildBlockedUsersFetcher } from './buildBlockedUsersFetcher';
import { buildBlockedUsersKey } from './buildBlockedUsersKey';

const useBlockedUsers = () => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildBlockedUsersKey(),

    queryFn: buildBlockedUsersFetcher({
      apiClient,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const flatData = useFlatPaginatedResults({
    data: result.data,
    key: 'blockedUsers',
  });

  return extendResult(result, { flatData });
};

export { useBlockedUsers };
