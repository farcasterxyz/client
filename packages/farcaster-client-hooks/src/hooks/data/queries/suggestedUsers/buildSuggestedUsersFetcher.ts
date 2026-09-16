import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';
import { defaultLimit } from './shared';

const buildSuggestedUsersFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedUsers,
  limit,
  randomized,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
  limit?: number;
  randomized: boolean | undefined;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getSuggestedUsers({
      cursor,
      limit: limit || defaultLimit,
      randomized,
    });

    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.users,
    });

    return response.data;
  });

export { buildSuggestedUsersFetcher };
