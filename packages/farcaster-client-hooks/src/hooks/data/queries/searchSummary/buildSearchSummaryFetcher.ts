import { ApiFid, FarcasterApiClient } from 'farcaster-client-data';

import {
  BatchMergeIntoGloballyCachedChannels,
  BatchMergeIntoGloballyCachedUsers,
} from '../../../../types';

const buildSearchSummaryFetcher =
  ({
    q,
    maxChannels,
    maxUsers,
    maxMiniApps,
    maxTokens,
    addFollowersYouKnowContext,
    intent,
    contextFid,
    apiClient,
    batchMergeIntoGloballyCachedChannels,
    batchMergeIntoGloballyCachedUsers,
  }: {
    q: string;
    maxChannels: number;
    maxUsers: number;
    maxMiniApps: number;
    maxTokens: number;
    addFollowersYouKnowContext: boolean;
    intent?: 'typeahead' | 'submit';
    contextFid?: ApiFid;
    apiClient: FarcasterApiClient;
    batchMergeIntoGloballyCachedChannels: BatchMergeIntoGloballyCachedChannels;
    batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
  }) =>
  async () => {
    const response = await apiClient.searchSummary({
      q,
      maxChannels,
      maxUsers,
      maxMiniApps,
      maxTokens,
      addFollowersYouKnowContext,
      intent,
      contextFid,
    });

    batchMergeIntoGloballyCachedChannels({
      batchUpdates: response.data.result.channels,
    });
    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.users,
    });

    return response.data;
  };

export { buildSearchSummaryFetcher };
