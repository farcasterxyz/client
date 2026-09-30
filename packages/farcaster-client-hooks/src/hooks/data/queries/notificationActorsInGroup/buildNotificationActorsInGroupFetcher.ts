import { ApiNotificationType, FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildNotificationActorsInGroupFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedUsers,
  groupId,
  type,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
  groupId: string;
  type: ApiNotificationType;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getNotificationActorsInGroup({
      cursor,
      groupId,
      limit: 15,
      type,
    });

    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.actors,
    });

    return response.data;
  });

export { buildNotificationActorsInGroupFetcher };
