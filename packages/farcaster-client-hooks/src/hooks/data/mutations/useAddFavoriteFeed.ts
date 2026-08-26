import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { ChannelsForCategoryCache } from '../../../types';
import { useOptimisticallyUpdateChannel } from '../optimistic/useOptimisticallyUpdateChannel';
import { useRefetchFeedSummaries } from '../queries/feedSummaries/useRefetchFeedSummaries';
import { buildUserChannelsForCategoryKey } from '../queries/userChannelsForCategory/buildUserChannelsForCategoryKey';

const useAddFavoriteFeed = () => {
  const qc = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const refetchFeedSummaries = useRefetchFeedSummaries();
  const optimisticallyUpdateFeed = useOptimisticallyUpdateChannel();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({
      feedKey,
      channel,
      fid,
    }: {
      feedKey: string;
      channel: ApiChannel | undefined;
      fid: number;
    }) => {
      if (typeof channel !== 'undefined') {
        qc.setQueryData<ChannelsForCategoryCache>(
          buildUserChannelsForCategoryKey({ fid, category: 'favorites' }),
          (data) => {
            if (!data) {
              return;
            }

            const { pages, pageParams } = data;

            const updatedPages = pages.map(
              ({ next, items: channels }, index) => {
                if (index === 0) {
                  return {
                    next: next,
                    items: [...channels, channel],
                  };
                } else {
                  return {
                    next: next,
                    items: channels,
                  };
                }
              },
            );

            return { pageParams, pages: updatedPages };
          },
        );
      }

      const revertOptimisticUpdates = optimisticallyUpdateFeed({
        updates: {
          key: feedKey,
          viewerContext: {
            favoritePosition: 1000,
          },
        },
        revertUpdates: {
          key: feedKey,
          viewerContext: {
            favoritePosition: -1,
          },
        },
      });

      try {
        // FIXME: We should never log analytics events in an internal / shared hook.
        // These have to be closer to when user actually takes the action.
        trackEvent(AnalyticsEvent.ToggleChannelFavorite, {
          toggle: 'on',
          channelKey: feedKey,
        });

        await apiClient.addFavoriteFeed({ feedKey: feedKey });
        setTimeout(() => {
          refetchFeedSummaries();
        }, 1000);
      } catch (error) {
        revertOptimisticUpdates();
        throw error;
      }
    },
    [apiClient, optimisticallyUpdateFeed, qc, refetchFeedSummaries, trackEvent],
  );
};

export { useAddFavoriteFeed };
