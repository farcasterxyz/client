import {
  DEFAULT_TIMEOUT_NOTIFICATIONS_FOR_TAB,
  FarcasterApiClient,
} from 'farcaster-client-data';

import {
  BatchMergeIntoGloballyCachedCasts,
  CastUpdates,
} from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

export const buildNotificationsForTabFetcher = ({
  apiClient,
  tab,
  setLastCheckedTimestamp,
  batchMergeIntoGloballyCachedCasts,
}: {
  apiClient: FarcasterApiClient;
  tab: string;
  setLastCheckedTimestamp?: boolean;
  batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
}) => {
  return wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getNotificationsForTab(
      {
        tab,
        cursor,
        limit: 15,
      },
      { timeout: DEFAULT_TIMEOUT_NOTIFICATIONS_FOR_TAB },
    );

    if (setLastCheckedTimestamp && !cursor) {
      await apiClient.setLastCheckedTimestamp();
    }

    const batchUpdates: CastUpdates[] = [];

    response.data.result.notifications.forEach((notification) => {
      if (notification.previewItems.length === 0) {
        return;
      }

      switch (notification.type) {
        case 'cast-mention':
        case 'cast-reply':
        case 'cast-reaction':
        case 'cast-quote':
        case 'trending-cast':
        case 'collectible-cast-bidder-cancelled':
        case 'collectible-cast-bidder-outbid':
        case 'collectible-cast-bidder-settled':
        case 'collectible-cast-bidder-time-left':
        case 'collectible-cast-creator-bid':
        case 'collectible-cast-creator-settled':
        case 'collectible-cast-watch-available': {
          const item = notification.previewItems[0];
          batchUpdates.push(item.content.cast);
          break;
        }
        case 'recast': {
          const item = notification.previewItems[0];
          batchUpdates.push(item.content.recastedCast);
          break;
        }
        case 'dormant-user-new-cast':
        case 'new-cast': {
          notification.previewItems.forEach((item) =>
            batchUpdates.push(item.content.cast),
          );
          break;
        }
        default:
          break;
      }
    });

    batchMergeIntoGloballyCachedCasts({ batchUpdates });

    return response.data;
  });
};
