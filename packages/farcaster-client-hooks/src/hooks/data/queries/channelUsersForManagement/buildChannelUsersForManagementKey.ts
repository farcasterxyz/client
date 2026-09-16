import { ApiChannelUserRole } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildChannelUsersForManagementKey = ({
  channelKey,
  query,
  role,
  pagination,
}: {
  channelKey: string;
  query?: string;
  role?: ApiChannelUserRole;
  pagination?: { limit?: number };
}) =>
  compactQueryKey([
    'channelUsersForManagement',
    channelKey,
    query,
    role,
    pagination,
  ]);
