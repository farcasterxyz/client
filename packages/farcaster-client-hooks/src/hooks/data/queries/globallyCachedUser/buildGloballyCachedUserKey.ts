import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildGloballyCachedUserKey = ({ fid }: { fid?: number } = {}) =>
  compactQueryKey(['globallyCachedUser', fid]) as string[];

export { buildGloballyCachedUserKey };
