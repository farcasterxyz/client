import { useQueryClient } from '@tanstack/react-query';
import {
  ApiChannelDetails,
  ApiChannelUserInviteRole,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import {
  invalidateChannelUsersQueries,
  useOptimisticallyAddSelfInRole,
} from '../channelUsers';
import { useInvalidateChannel } from '../queries/channel/useInvalidateChannel';
import { buildChannelDetailsKey } from '../queries/channelDetails/buildChannelDetailsKey';
import { useInvalidateChannelDetails } from '../queries/channelDetails/useInvalidateChannelDetails';
import { useRemoveAggNotification } from '../queries/notificationsForTab/useRemoveAggNotification';
import { useInvalidateUserAppContext } from '../queries/userAppContext/useInvalidateUserAppContext';

export const useRespondToChannelInvite = () => {
  const { apiClient } = useFarcasterApiClient();
  const removeAggNotification = useRemoveAggNotification();
  const queryClient = useQueryClient();
  const invalidateUserAppContext = useInvalidateUserAppContext();
  const invalidateChannel = useInvalidateChannel();
  const invalidateChannelDetails = useInvalidateChannelDetails();
  const optimisticallyAddSelfInRole = useOptimisticallyAddSelfInRole();

  return useCallback(
    async ({
      channelKey,
      role,
      accept,
    }: {
      channelKey: string;
      role: ApiChannelUserInviteRole;
      accept: boolean;
    }) => {
      const respond = async () => {
        const { data } = await apiClient.respondToChannelInvite({
          channelKey,
          role,
          accept,
        });

        return data.result;
      };

      queryClient.setQueryData<ApiChannelDetails>(
        buildChannelDetailsKey({ key: channelKey }),
        (data) => {
          if (!data) {
            return;
          }

          return {
            ...data,
            viewerContext: {
              ...data.viewerContext,
              invite: undefined,
            },
          };
        },
      );

      try {
        const result = await (async () => {
          if (accept) {
            return await optimisticallyAddSelfInRole({
              channelKey,
              role,
              execute: respond,
            });
          }

          return await respond();
        })();

        removeAggNotification({
          type: 'channel-role-invite',
          id: channelKey,
        });

        void invalidateUserAppContext();
        void invalidateChannel({ key: channelKey }); // refetch to get restricted attributes (i.e. inviteCode)
        void invalidateChannelUsersQueries({ queryClient, channelKey });

        return result;
      } catch {
        queryClient.invalidateQueries({
          queryKey: buildChannelDetailsKey({ key: channelKey }),
        });

        void invalidateChannelDetails({ key: channelKey });
        void invalidateChannel({ key: channelKey });
      }
    },
    [
      queryClient,
      apiClient,
      removeAggNotification,
      invalidateUserAppContext,
      invalidateChannel,
      optimisticallyAddSelfInRole,
      invalidateChannelDetails,
    ],
  );
};
