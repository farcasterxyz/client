import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildCastLikesFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedUsers,
  castHash,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
  castHash: string;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getCastLikes({
      cursor,
      castHash,
      limit: 15,
    });

    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.likes.map(
        (reaction) => reaction.reactor,
      ),
    });

    return response.data;
  });

export { buildCastLikesFetcher };
