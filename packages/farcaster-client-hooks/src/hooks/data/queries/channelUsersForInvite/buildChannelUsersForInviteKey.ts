import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildChannelUsersForInviteKey = ({
  channelKey,
  query,
  pagination,
}: {
  channelKey: string;
  query?: string;
  pagination?: { limit: number };
}) => compactQueryKey(['channelUsersForInvite', channelKey, query, pagination]);
