import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import {
  invalidateChannelUsersQueries,
  updateChannelUserInCache,
} from '../channelUsers';

export const useInviteToModerateChannel = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({ fid, channelKey }: { fid: number; channelKey: string }) => {
      try {
        updateChannelUserInCache({
          queryClient,
          channelKey,
          fid,
          update: (channelUser) => ({
            ...channelUser,
            relation: 'pending-moderator' as const,
          }),
        });

        trackEvent(AnalyticsEvent.InviteToChannelRole, {
          channelKey,
          role: 'moderator',
        });

        await apiClient.inviteChannelUserToRole({
          inviteFid: fid,
          channelKey,
          role: 'moderator',
        });
      } catch (e) {
        invalidateChannelUsersQueries({ queryClient, channelKey });
        throw e;
      }
    },
    [apiClient, queryClient, trackEvent],
  );
};
