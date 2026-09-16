import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserByFidKey = ({ fid }: { fid?: number }) =>
  compactQueryKey(['userByFid', fid]);

export { buildUserByFidKey };
