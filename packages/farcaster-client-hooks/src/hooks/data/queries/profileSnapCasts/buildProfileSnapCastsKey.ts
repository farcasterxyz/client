import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildProfileSnapCastsKey = ({ fid }: { fid: number | undefined }) =>
  compactQueryKey(['profileSnapCasts', fid]);

export { buildProfileSnapCastsKey };
