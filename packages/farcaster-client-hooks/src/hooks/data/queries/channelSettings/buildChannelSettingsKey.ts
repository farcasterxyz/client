import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildChannelSettingsKey = ({ key }: { key: string }) =>
  compactQueryKey(['channelSettings', key]);

export { buildChannelSettingsKey };
