import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedChannels } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildDiscoverChannelsFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedChannels,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedChannels: BatchMergeIntoGloballyCachedChannels;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.discoverChannels({
      cursor,
      limit: 15,
    });

    batchMergeIntoGloballyCachedChannels({
      batchUpdates: response.data.result.channels,
    });

    return response.data;
  });

export { buildDiscoverChannelsFetcher };
