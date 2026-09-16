import { QueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { apiChannelUserKeyExtractor } from '../../channelUsers';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { buildChannelUsersFetcher } from './buildChannelUsersFetcher';
import { buildChannelUsersKey } from './buildChannelUsersKey';

const useChannelUsers = ({
  channelKey,
  filterToMembers,
  query = '',
  limit = 20,
}: {
  channelKey: string;
  filterToMembers: boolean;
  query?: string;
  limit?: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildChannelUsersKey({
      channelKey,
      filterToMembers,
      query,
      limit,
    }),

    queryFn: buildChannelUsersFetcher({
      apiClient,
      params: {
        limit,
        channelKey,
        filterToMembers,
        query,
      },
    }),

    getNextPageParam: getNextPageCursor,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: apiChannelUserKeyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { flatData, onEndReached });
};

export const buildChannelFollowersKey = ({
  channelKey,
  query,
}: {
  channelKey: string;
  query?: string;
}) => buildChannelUsersKey({ channelKey, filterToMembers: false, query });

export const useChannelFollowers = ({
  channelKey,
  query = '',
  limit = 20,
}: {
  channelKey: string;
  query?: string;
  limit?: number;
}) => {
  return useChannelUsers({
    filterToMembers: false,
    channelKey,
    query,
    limit,
  });
};

export const invalidateChannelFollowers = ({
  queryClient,
  channelKey,
}: {
  queryClient: QueryClient;
  channelKey: string;
}) => {
  queryClient.invalidateQueries({
    queryKey: buildChannelUsersKey({ channelKey, filterToMembers: false }),
  });
};

export const buildChannelMembersKey = ({
  channelKey,
  query,
}: {
  channelKey: string;
  query?: string;
}) => buildChannelUsersKey({ channelKey, filterToMembers: true, query });

export const useChannelMembers = ({
  channelKey,
  query = '',
  limit = 20,
}: {
  channelKey: string;
  query?: string;
  limit?: number;
}) => {
  return useChannelUsers({
    filterToMembers: true,
    channelKey,
    query,
    limit,
  });
};
