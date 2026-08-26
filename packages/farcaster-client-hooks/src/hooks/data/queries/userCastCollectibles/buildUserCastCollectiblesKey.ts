import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserCastCollectiblesKey = ({ fid }: { fid: number }) =>
  compactQueryKey(['userCastCollectibles', fid]);

export { buildUserCastCollectiblesKey };
