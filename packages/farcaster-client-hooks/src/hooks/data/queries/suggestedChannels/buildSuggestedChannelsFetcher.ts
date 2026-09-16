import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedChannels } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildSuggestedChannelsFetcher = ({
  apiClient,
  currentChannelKey,
  batchMergeIntoGloballyCachedChannels,
  limit = 4,
}: {
  apiClient: FarcasterApiClient;
  currentChannelKey?: string;
  batchMergeIntoGloballyCachedChannels: BatchMergeIntoGloballyCachedChannels;
  limit?: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.discoverChannels({
      cursor,
      currentChannelKey: currentChannelKey,
      limit: currentChannelKey ? limit : 10, // We pick top 10 channel recommendations and reorder unless using a channel key to get similar channnels
    });

    batchMergeIntoGloballyCachedChannels({
      batchUpdates: response.data.result.channels,
    });

    if (!currentChannelKey && response.data.result.channels.length > limit) {
      response.data.result.channels.sort(() => Math.random() - 0.5);
      response.data.result.channels = response.data.result.channels.slice(
        0,
        limit,
      );
    }

    return response.data;
  });

export { buildSuggestedChannelsFetcher };
