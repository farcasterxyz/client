import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTotpEnabledKey = ({ email }: { email?: string } = {}) =>
  compactQueryKey(['totpEnabled', email]);

export { buildTotpEnabledKey };
