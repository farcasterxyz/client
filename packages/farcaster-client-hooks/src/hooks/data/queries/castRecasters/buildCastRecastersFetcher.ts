import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildCastRecastersFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedUsers,
  castHash,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
  castHash: string;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getCastRecasters({
      castHash,
      cursor,
      limit: 15,
    });

    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.users,
    });

    return response.data;
  });

export { buildCastRecastersFetcher };
