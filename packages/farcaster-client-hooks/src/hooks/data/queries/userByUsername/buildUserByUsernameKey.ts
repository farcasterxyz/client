import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserByUsernameKey = ({ username }: { username: string }) =>
  compactQueryKey(['userByUsername', username]);

export { buildUserByUsernameKey };
