import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildChannelKey = ({ key }: { key: string }) =>
  compactQueryKey(['channel', key]);

export { buildChannelKey };
