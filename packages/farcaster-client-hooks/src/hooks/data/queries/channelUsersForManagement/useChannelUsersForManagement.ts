import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ApiChannelUser,
  ApiChannelUserRole,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { buildChannelUsersForManagementFetcher } from './buildChannelUsersForManagementFetcher';
import { buildChannelUsersForManagementKey } from './buildChannelUsersForManagementKey';

const keyExtractor = (item: ApiChannelUser) => {
  return item.user.fid.toString();
};

export const useChannelUsersForManagement = ({
  channelKey,
  query = '',
  limit = 20,
  role,
}: {
  channelKey: string;
  query?: string;
  limit?: number;
  role?: ApiChannelUserRole;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildChannelUsersForManagementKey({
      channelKey,
      query,
      role,
      pagination: { limit },
    }),

    queryFn: buildChannelUsersForManagementFetcher({
      apiClient,
      params: { channelKey, limit, query, role },
    }),

    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: keyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { flatData, onEndReached });
};
