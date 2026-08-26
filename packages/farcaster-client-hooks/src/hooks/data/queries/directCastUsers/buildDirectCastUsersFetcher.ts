import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildDirectCastUsersFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedUsers,
  q,
  excludeFids,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
  q: string;
  excludeFids?: number[];
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getDirectCastUsers({
      q,
      excludeFids: excludeFids ? excludeFids.join(',') : undefined,
      cursor,
      limit: 15,
      vNext: true,
    });

    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.users,
    });

    return response.data;
  });

export { buildDirectCastUsersFetcher };
