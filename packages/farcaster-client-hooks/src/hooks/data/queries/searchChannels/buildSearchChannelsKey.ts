import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildSearchChannelsKey = ({
  limit,
  q,
  prioritizeFollowed,
}: {
  limit: number | undefined;
  q: string | undefined;
  prioritizeFollowed: boolean;
}) => compactQueryKey(['searchChannels', q, limit, prioritizeFollowed]);
