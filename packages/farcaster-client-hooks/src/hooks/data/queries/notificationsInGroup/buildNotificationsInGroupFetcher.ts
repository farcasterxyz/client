import {
  ApiNotificationType,
  ApiUser,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildNotificationsInGroupFetcher = ({
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
    const response = await apiClient.getNotificationsInGroup({
      cursor,
      groupId,
      limit: 15,
      type,
    });

    batchMergeIntoGloballyCachedUsers({
      batchUpdates: response.data.result.notifications
        .map((notification) =>
          'actor' in notification ? notification.actor : undefined,
        )
        .filter((actor): actor is ApiUser => !!actor),
    });

    return response.data;
  });

export { buildNotificationsInGroupFetcher };
