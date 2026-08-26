import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildChannelBannedUsersKey = ({
  channelKey,
  query,
  limit,
}: {
  channelKey: string;
  query?: string;
  limit?: number;
}) => compactQueryKey(['channelBannedUsers', channelKey, query, limit]);
