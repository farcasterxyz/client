import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildChannelDetailsKey = ({ key }: { key: string }) =>
  compactQueryKey(['channelDetails', key]);

export { buildChannelDetailsKey };
