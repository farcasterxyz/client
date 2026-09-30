import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildInvitedKey = ({ email }: { email: string }) =>
  compactQueryKey(['invited', email]);

export { buildInvitedKey };
