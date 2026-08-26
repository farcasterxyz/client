import {
  QueryClient,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getNextPageCursor } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  apiChannelUserKeyExtractor,
  updateChannelUserInCache,
} from '../../channelUsers';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { buildChannelUsersForInviteFetcher } from './buildChannelUsersForInviteFetcher';
import { buildChannelUsersForInviteKey } from './buildChannelUsersForInviteKey';

const invalidateChannelInvites = ({
  queryClient,
  channelKey,
}: {
  queryClient: QueryClient;
  channelKey: string;
}) => {
  queryClient.invalidateQueries({
    queryKey: buildChannelUsersForInviteKey({ channelKey }),
  });
};

export const useChannelUsersForInvite = ({
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
    initialPageParam: undefined,
    queryKey: buildChannelUsersForInviteKey({
      channelKey,
      query,
      pagination: { limit },
    }),

    queryFn: buildChannelUsersForInviteFetcher({
      apiClient,
      params: {
        limit,
        channelKey,
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

export const useInviteToChannel = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({ fid, channelKey }: { fid: number; channelKey: string }) => {
      try {
        trackEvent(AnalyticsEvent.InviteToChannelRole, {
          channelKey: channelKey,
          role: 'member',
        });

        updateChannelUserInCache({
          queryClient,
          channelKey,
          fid,
          update: (channelUser) => {
            return {
              ...channelUser,
              relation: 'pending-member' as const,
            };
          },
        });

        await apiClient.inviteChannelUserToRole({
          inviteFid: fid,
          channelKey,
          role: 'member',
        });
      } catch (e) {
        invalidateChannelInvites({ queryClient, channelKey });
        throw e;
      }
    },
    [apiClient, queryClient, trackEvent],
  );
};
