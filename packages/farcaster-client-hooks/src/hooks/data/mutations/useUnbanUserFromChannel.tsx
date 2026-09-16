import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateChannelBannedUsers } from '../queries/channelBannedUsers/useChannelBannedUsers';
import { useInvalidateFeedItems } from '../queries/feedItems/useInvalidateFeedItems';

export const useUnbanUserFromChannel = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateFeedItems = useInvalidateFeedItems();
  const invalidateChannelBannedUsers = useInvalidateChannelBannedUsers();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({
      channelKey,
      unbanFid,
    }: {
      channelKey: string;
      unbanFid: number;
    }) => {
      trackEvent(AnalyticsEvent.ClickUnbanUserFromChannel, {
        channelKey,
        unbanFid,
      });

      await apiClient.unbanUserFromChannel({
        channelKey,
        unbanFid,
      });

      invalidateChannelBannedUsers({ channelKey });

      for (const feedType of ['default', 'curated', 'priority', 'members']) {
        void invalidateFeedItems({
          feedKey: channelKey,
          feedType,
        });
      }
    },
    [apiClient, invalidateChannelBannedUsers, invalidateFeedItems, trackEvent],
  );
};
