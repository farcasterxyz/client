import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserCastsKey = ({ fid }: { fid: number | undefined }) =>
  compactQueryKey(['userCasts', fid]);

export { buildUserCastsKey };
