import { ApiChannel, FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedChannels } from '../../../../types';

const buildFeedSummariesFetcher =
  ({
    apiClient,
    batchMergeIntoGloballyCachedChannels,
    onFeedSummariesFetched,
  }: {
    apiClient: FarcasterApiClient;
    batchMergeIntoGloballyCachedChannels: BatchMergeIntoGloballyCachedChannels;
    onFeedSummariesFetched?: (summaries: ApiChannel[]) => void;
  }) =>
  async () => {
    const response = await apiClient.getFeedSummaries();

    batchMergeIntoGloballyCachedChannels({
      batchUpdates: response.data.result.feedSummaries,
    });

    if (onFeedSummariesFetched) {
      onFeedSummariesFetched(response.data.result.feedSummaries);
    }

    return response.data.result.feedSummaries;
  };

export { buildFeedSummariesFetcher };
