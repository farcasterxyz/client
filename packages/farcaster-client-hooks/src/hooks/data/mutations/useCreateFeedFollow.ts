import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { CreateFeedFollowError } from '../../../errors';
import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyFollowFeed } from '../channelUsers';

const useCreateFeedFollow = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyFollowFeed = useOptimisticallyFollowFeed();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({
      feedKey,
      following,
      location,
    }: {
      feedKey: string;
      following?: boolean;
      // used for analytics
      location?: string;
    }) =>
      await optimisticallyFollowFeed({
        feedKey,
        following,
        execute: async () => {
          try {
            trackEvent(AnalyticsEvent.ToggleChannelFollow, {
              channelKey: feedKey,
              toggle: 'on',
              location: location ?? 'unknown',
            });

            const result = await apiClient.createFeedFollow({
              feedKey: feedKey,
            });

            return result;
          } catch (error) {
            throw new CreateFeedFollowError({
              feedKey: feedKey,
              error,
            });
          }
        },
      }),
    [apiClient, optimisticallyFollowFeed, trackEvent],
  );
};

export { useCreateFeedFollow };
