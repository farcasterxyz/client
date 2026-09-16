import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import {
  invalidateChannelUsersQueries,
  removeChannelMemberFromCache,
} from '../channelUsers';
import { useMergeIntoGloballyCachedChannel } from '../queries/globallyCachedChannel/useMergeIntoGloballyCachedChannel';
import { useInvalidateUserChannelsForCategory } from '../queries/userChannelsForCategory/useInvalidateUserChannelsForCategory';
import { useRemoveFromUserChannelsForCategoryCache } from '../queries/userChannelsForCategory/useRemoveFromUserChannelsForCategoryCache';

export const useRemoveChannelMember = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const { trackEvent } = useTrackEvent();
  const mergeIntoGloballyCachedChannel = useMergeIntoGloballyCachedChannel();
  const removeFromUserChannelsForCategoryCache =
    useRemoveFromUserChannelsForCategoryCache();
  const invalidateUserChannelsForCategory =
    useInvalidateUserChannelsForCategory();

  return useCallback(
    async ({
      removeFid,
      channelKey,
      actorFid,
    }: {
      removeFid: number;
      channelKey: string;
      actorFid: number;
    }) => {
      try {
        trackEvent(AnalyticsEvent.RemoveFromChannelRole, {
          channelKey,
          role: 'member',
          removeFid,
        });

        removeChannelMemberFromCache({
          queryClient,
          channelKey,
          fid: removeFid,
        });

        if (removeFid === actorFid) {
          mergeIntoGloballyCachedChannel({
            updates: {
              key: channelKey,
              viewerContext: {
                isMember: false,
              },
            },
          });

          removeFromUserChannelsForCategoryCache({
            category: 'member',
            channelKey,
            fid: actorFid,
          });
        }

        await apiClient.removeChannelUserFromRole({
          channelKey,
          removeFid,
          role: 'member',
        });

        if (removeFid === actorFid) {
          // channel will likely now be in their follow category
          void invalidateUserChannelsForCategory({
            category: 'follow',
            fid: actorFid,
          });
        }
      } catch (e) {
        invalidateChannelUsersQueries({
          queryClient,
          channelKey,
        });

        if (removeFid === actorFid) {
          mergeIntoGloballyCachedChannel({
            updates: {
              key: channelKey,
              viewerContext: {
                isMember: true,
              },
            },
          });

          // we optimistcally removed the channel from this cache, invalidate
          // to bring it back
          void invalidateUserChannelsForCategory({
            category: 'member',
            fid: actorFid,
          });
        }

        throw e;
      }
    },
    [
      apiClient,
      invalidateUserChannelsForCategory,
      mergeIntoGloballyCachedChannel,
      queryClient,
      removeFromUserChannelsForCategoryCache,
      trackEvent,
    ],
  );
};
