import { ApiNotificationType } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildNotificationActorsInGroupKey = ({
  groupId,
  type,
}: {
  groupId: string;
  type: ApiNotificationType;
}) => compactQueryKey(['notificationActorsInGroup', type, groupId]);

export { buildNotificationActorsInGroupKey };
