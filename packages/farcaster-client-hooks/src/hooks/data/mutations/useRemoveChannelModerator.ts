import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserAppContext } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import {
  invalidateChannelUsersQueries,
  updateChannelUserInCache,
} from '../channelUsers';
import { buildUserAppContextKey } from '../queries/userAppContext/buildUserAppContextKey';
import { useInvalidateUserChannelsForCategory } from '../queries/userChannelsForCategory/useInvalidateUserChannelsForCategory';
import { useRemoveFromUserChannelsForCategoryCache } from '../queries/userChannelsForCategory/useRemoveFromUserChannelsForCategoryCache';

export const useRemoveChannelModerator = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const { trackEvent } = useTrackEvent();
  const removeFromUserChannelsForCategoryCache =
    useRemoveFromUserChannelsForCategoryCache();
  const invalidateUserChannelsForCategory =
    useInvalidateUserChannelsForCategory();

  return useCallback(
    async ({
      fid,
      channelKey,
      actorFid,
    }: {
      fid: number;
      channelKey: string;
      actorFid: number;
    }) => {
      try {
        updateChannelUserInCache({
          queryClient,
          channelKey,
          fid,
          update: (channelUser) => ({
            ...channelUser,
            relation: 'member' as const,
          }),
        });

        if (actorFid === fid) {
          queryClient.setQueryData<ApiUserAppContext>(
            buildUserAppContextKey(),
            (data) => {
              if (!data) {
                return;
              }

              const modOfChannelKeys = (data.modOfChannelKeys ?? []).filter(
                (key) => key !== channelKey,
              );

              return {
                ...data,
                modOfChannelKeys,
              };
            },
          );

          removeFromUserChannelsForCategoryCache({
            category: 'moderate',
            channelKey,
            fid: actorFid,
          });
        }

        trackEvent(AnalyticsEvent.RemoveFromChannelRole, {
          channelKey,
          role: 'moderator',
        });

        await apiClient.removeChannelUserFromRole({
          channelKey,
          removeFid: fid,
          role: 'moderator',
        });

        if (actorFid === fid) {
          // channel will now be in their member category
          void invalidateUserChannelsForCategory({
            category: 'member',
            fid: actorFid,
          });
        }
      } catch (e) {
        invalidateChannelUsersQueries({
          queryClient,
          channelKey,
        });

        if (actorFid === fid) {
          queryClient.setQueryData<ApiUserAppContext>(
            buildUserAppContextKey(),
            (data) => {
              if (!data) {
                return;
              }

              const modOfChannelKeys = (data.modOfChannelKeys ?? []).filter(
                (key) => key !== channelKey,
              );

              return {
                ...data,
                modOfChannelKeys: [...modOfChannelKeys, channelKey],
              };
            },
          );

          // we optimistcally removed the channel from this cache, invalidate
          // to bring it back
          void invalidateUserChannelsForCategory({
            category: 'moderate',
            fid: actorFid,
          });
        }

        throw e;
      }
    },
    [
      apiClient,
      invalidateUserChannelsForCategory,
      queryClient,
      removeFromUserChannelsForCategoryCache,
      trackEvent,
    ],
  );
};
