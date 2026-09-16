import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildChannelUsersKey = ({
  channelKey,
  filterToMembers,
  query,
  limit,
}: {
  channelKey: string;
  filterToMembers?: boolean;
  query?: string;
  limit?: number;
}) =>
  compactQueryKey(['channelUsers', channelKey, filterToMembers, query, limit]);

export { buildChannelUsersKey };
