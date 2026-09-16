import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedChannels } from '../../../../types';

const buildHighlightedChannelsFetcher =
  ({
    apiClient,
    batchMergeIntoGloballyCachedChannels,
  }: {
    apiClient: FarcasterApiClient;
    batchMergeIntoGloballyCachedChannels: BatchMergeIntoGloballyCachedChannels;
  }) =>
  async () => {
    const response = await apiClient.getHighlightedChannels();

    batchMergeIntoGloballyCachedChannels({
      batchUpdates: response.data.result.channels,
    });

    return response.data.result;
  };

export { buildHighlightedChannelsFetcher };
