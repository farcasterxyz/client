import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserLikedCastsKey = ({ fid }: { fid: number }) =>
  compactQueryKey(['userLikedCasts', fid]);

export { buildUserLikedCastsKey };
