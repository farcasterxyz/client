import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildChannelFollowersYouKnowKey = ({
  channelKey,
  limit,
}: {
  channelKey: string;
  limit: number;
}) => compactQueryKey(['channelFollowersYouKnow', channelKey, limit]);

export { buildChannelFollowersYouKnowKey };
