import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildMutedUsersKey = () => compactQueryKey(['mutedUsers']);

export { buildMutedUsersKey };
