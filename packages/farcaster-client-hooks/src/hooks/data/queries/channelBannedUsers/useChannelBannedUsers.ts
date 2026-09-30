import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiChannelUser,
  ApiGetChannelBannedUsersQueryParams,
  FarcasterApiClient,
  getNextPageCursor,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { apiChannelUserKeyExtractor } from '../../channelUsers';
import {
  extendResult,
  PaginatedResultFetcher,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { buildChannelBannedUsersKey } from './buildChannelBannedUsersKey';

const buildChannelBannedUsersFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetChannelBannedUsersQueryParams;
  }): PaginatedResultFetcher<ApiChannelUser> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.getChannelBannedUsers({
      ...params,
      cursor,
    });

    return {
      items: response.data.result.users,
      next: response.data.next,
    };
  };

export const useChannelBannedUsers = ({
  channelKey,
  query = '',
  limit = 20,
}: {
  channelKey: string;
  query?: string;
  limit?: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    queryKey: buildChannelBannedUsersKey({
      channelKey,
      query,
      limit,
    }),
    queryFn: buildChannelBannedUsersFetcher({
      apiClient,
      params: {
        limit,
        channelKey,
        query,
      },
    }),
    initialPageParam: undefined,
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

export const useInvalidateChannelBannedUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ channelKey }: { channelKey: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildChannelBannedUsersKey({ channelKey }),
      });
    },
    [queryClient],
  );
};
