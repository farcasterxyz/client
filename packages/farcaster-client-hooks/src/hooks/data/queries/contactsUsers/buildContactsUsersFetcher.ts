import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildContactsUsersFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedUsers,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getContactsUsers({
      cursor,
      limit: 15,
    });

    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.users,
    });

    return response.data;
  });

export { buildContactsUsersFetcher };
