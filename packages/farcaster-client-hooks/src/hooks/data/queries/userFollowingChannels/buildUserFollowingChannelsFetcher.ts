import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedChannels } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildUserFollowingChannelsFetcher = ({
  forComposer,
  apiClient,
  batchMergeIntoGloballyCachedChannels,
}: {
  forComposer: boolean;
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedChannels: BatchMergeIntoGloballyCachedChannels;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getUserCastableChannels({
      forComposer,
      cursor,
      // High because channel lists (e.g. web left nav) don't take a lot of vertical
      // space and we always show many
      limit: 50,
    });

    batchMergeIntoGloballyCachedChannels({
      batchUpdates: response.data.result.channels,
    });

    return response.data;
  });

export { buildUserFollowingChannelsFetcher };
