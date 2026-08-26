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

const useRemoveFavoriteFeed = () => {
  const qc = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const refetchFeedSummaries = useRefetchFeedSummaries();
  const optimisticallyUpdateFeed = useOptimisticallyUpdateChannel();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({
      feedKey,
      favoritePosition,
      channel,
      fid,
    }: {
      feedKey: string;
      favoritePosition: number;
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

            const updatedPages = pages.map(({ next, items }) => {
              const channels = items;
              const filtered = channels.filter((c) => c.key !== channel.key);

              return {
                next: next,
                items: filtered,
              };
            });

            return { pageParams, pages: updatedPages };
          },
        );
      }

      const revertOptimisticUpdates = optimisticallyUpdateFeed({
        updates: {
          key: feedKey,
          viewerContext: {
            favoritePosition: -1,
          },
        },
        revertUpdates: {
          key: feedKey,
          viewerContext: {
            favoritePosition,
          },
        },
      });

      try {
        trackEvent(AnalyticsEvent.ToggleChannelFavorite, {
          toggle: 'off',
          channelKey: feedKey,
        });

        await apiClient.removeFavoriteFeed({ feedKey });
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

export { useRemoveFavoriteFeed };
