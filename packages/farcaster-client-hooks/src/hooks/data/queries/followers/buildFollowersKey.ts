import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildFollowersKey = ({ fid }: { fid: number | undefined }) =>
  compactQueryKey(['followers', fid]);

export { buildFollowersKey };
