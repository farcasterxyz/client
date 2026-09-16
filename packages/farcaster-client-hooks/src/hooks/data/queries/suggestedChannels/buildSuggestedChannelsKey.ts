import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildSuggestedChannelsKey = ({
  limit,
  currentChannelKey,
}: {
  limit?: number;
  currentChannelKey?: string;
}) => compactQueryKey(['suggestedChannels', limit, currentChannelKey]);

export { buildSuggestedChannelsKey };
