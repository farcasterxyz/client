import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildFollowingKey = ({ fid }: { fid: number | undefined }) =>
  compactQueryKey(['following', fid]);

export { buildFollowingKey };
