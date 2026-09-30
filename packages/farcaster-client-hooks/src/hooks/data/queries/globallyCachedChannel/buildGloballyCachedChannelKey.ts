import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildGloballyCachedChannelKey = ({ key }: { key?: string } = {}) =>
  compactQueryKey(['globallyCachedChannel', key]) as string[];

export { buildGloballyCachedChannelKey };
