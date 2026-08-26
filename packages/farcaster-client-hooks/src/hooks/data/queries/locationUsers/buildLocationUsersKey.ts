import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildLocationUsersKey = ({ placeId }: { placeId: string }) =>
  compactQueryKey(['locationUsers', placeId]);

export { buildLocationUsersKey };
