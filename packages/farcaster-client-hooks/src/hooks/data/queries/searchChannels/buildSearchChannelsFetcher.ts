import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedChannels } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildSearchChannelsFetcher = ({
  q,
  prioritizeFollowed,
  forComposer,
  limit,
  apiClient,
  batchMergeIntoGloballyCachedChannels,
}: {
  q: string;
  limit: number;
  prioritizeFollowed: boolean;
  forComposer: boolean;
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedChannels: BatchMergeIntoGloballyCachedChannels;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.searchChannels({
      cursor,
      q,
      prioritizeFollowed,
      forComposer,
      limit,
    });

    batchMergeIntoGloballyCachedChannels({
      batchUpdates: response.data.result.channels,
    });

    return response.data;
  });

export { buildSearchChannelsFetcher };
