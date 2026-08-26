import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { DeleteFeedFollowError } from '../../../errors';
import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateChannel } from '../optimistic/useOptimisticallyUpdateChannel';
import { useInvalidateChannel } from '../queries/channel/useInvalidateChannel';
import { useInvalidateDiscoverChannels } from '../queries/discoverChannels/useInvalidateDiscoverChannels';
import { useRefetchFeedSummaries } from '../queries/feedSummaries/useRefetchFeedSummaries';
import { useInvalidateHighlightedChannels } from '../queries/highlightedChannels/useInvalidateHighlightedChannels';
import { useInvalidateUserChannelsForCategory } from '../queries/userChannelsForCategory/useInvalidateUserChannelsForCategory';
import { useRemoveFromUserChannelsForCategoryCache } from '../queries/userChannelsForCategory/useRemoveFromUserChannelsForCategoryCache';
import { useInvalidateUserFollowingChannels } from '../queries/userFollowingChannels/useInvalidateUserFollowingChannels';

const useDeleteFeedFollow = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateFeed = useOptimisticallyUpdateChannel();
  const removeFromUserChannelsForCategoryCache =
    useRemoveFromUserChannelsForCategoryCache();
  const refetchFeedSummaries = useRefetchFeedSummaries();
  const invalidateHighlightedChannels = useInvalidateHighlightedChannels();
  const invalidateChannel = useInvalidateChannel();
  const invalidateUserFollowingChannels = useInvalidateUserFollowingChannels();
  const invalidateUserChannelsForCategory =
    useInvalidateUserChannelsForCategory();
  const invalidateDiscoverChannels = useInvalidateDiscoverChannels();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({
      feedKey,
      following,
      fid,
      location,
    }: {
      feedKey: string;
      following: boolean;
      fid: number;
      // used for analytics
      location?: string;
    }) => {
      const revertOptimisticUpdates = optimisticallyUpdateFeed({
        updates: {
          key: feedKey,
          viewerContext: {
            following: false,
          },
        },
        revertUpdates: {
          key: feedKey,
          viewerContext: {
            following,
          },
        },
      });

      removeFromUserChannelsForCategoryCache({
        fid,
        channelKey: feedKey,
        category: 'follow',
      });

      try {
        trackEvent(AnalyticsEvent.ToggleChannelFollow, {
          channelKey: feedKey,
          toggle: 'on',
          location: location ?? 'unknown',
        });

        const result = await apiClient.deleteFeedFollow({
          feedKey: feedKey,
        });

        void Promise.all([
          refetchFeedSummaries(),
          invalidateUserFollowingChannels(),
          invalidateDiscoverChannels(),
          invalidateChannel({ key: feedKey }),
          invalidateUserChannelsForCategory({ fid, category: 'follow' }),
        ]);

        // Backend updates this async, so wait a bit
        setTimeout(() => {
          void invalidateHighlightedChannels();
        }, 2000);

        return result;
      } catch (error) {
        revertOptimisticUpdates();
        void invalidateUserChannelsForCategory({ fid, category: 'follow' });

        throw new DeleteFeedFollowError({
          feedKey: feedKey,
          error,
        });
      }
    },
    [
      optimisticallyUpdateFeed,
      removeFromUserChannelsForCategoryCache,
      trackEvent,
      apiClient,
      refetchFeedSummaries,
      invalidateUserFollowingChannels,
      invalidateDiscoverChannels,
      invalidateChannel,
      invalidateUserChannelsForCategory,
      invalidateHighlightedChannels,
    ],
  );
};

export { useDeleteFeedFollow };
