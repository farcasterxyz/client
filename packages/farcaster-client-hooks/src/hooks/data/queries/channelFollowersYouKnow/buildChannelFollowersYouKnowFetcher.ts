import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildChannelFollowersYouKnowFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedUsers,
  channelKey,
  limit,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
  channelKey: string;
  limit: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getChannelFollowersYouKnow({
      cursor,
      channelKey,
      limit: limit,
    });

    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.users,
    });

    return response.data;
  });

export { buildChannelFollowersYouKnowFetcher };
