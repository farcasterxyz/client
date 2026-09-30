import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateFeedItems } from '../queries/feedItems/useInvalidateFeedItems';

const useBanUserFromChannel = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateFeedItems = useInvalidateFeedItems();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({ channelKey, banFid }: { channelKey: string; banFid: number }) => {
      trackEvent(AnalyticsEvent.ClickBanUserFromChannel, {
        channelKey,
        banFid,
      });

      await apiClient.banUserFromChannel({
        channelKey,
        banFid,
      });

      for (const feedType of ['default', 'curated', 'priority', 'members']) {
        void invalidateFeedItems({
          feedKey: channelKey,
          feedType,
        });
      }
    },
    [apiClient, invalidateFeedItems, trackEvent],
  );
};

export { useBanUserFromChannel };
