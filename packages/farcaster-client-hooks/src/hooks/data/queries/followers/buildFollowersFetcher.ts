import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildFollowersFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedUsers,
  fid,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
  fid: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getFollowers({ cursor, fid, limit: 50 });

    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.users,
    });

    return response.data;
  });

export { buildFollowersFetcher };
