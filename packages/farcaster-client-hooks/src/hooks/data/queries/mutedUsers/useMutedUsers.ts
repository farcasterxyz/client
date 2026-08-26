import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useFlatPaginatedResults } from '../../helpers';
import { buildMutedUsersFetcher } from './buildMutedUsersFetcher';
import { buildMutedUsersKey } from './buildMutedUsersKey';

const useMutedUsers = () => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildMutedUsersKey(),

    queryFn: buildMutedUsersFetcher({
      apiClient,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const flatData = useFlatPaginatedResults({
    data: result.data,
    key: 'mutedUsers',
  });

  return extendResult(result, { flatData });
};

export { useMutedUsers };
