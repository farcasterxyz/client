import { ApiNotificationType } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildNotificationsInGroupKey = ({
  groupId,
  type,
}: {
  groupId: string;
  type: ApiNotificationType;
}) => compactQueryKey(['notificationsInGroup', type, groupId]);

export { buildNotificationsInGroupKey };
