import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildBlockedUsersKey = () => compactQueryKey(['blockedUsers']);

export { buildBlockedUsersKey };
