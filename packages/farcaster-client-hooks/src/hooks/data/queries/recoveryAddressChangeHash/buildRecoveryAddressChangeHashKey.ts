import { ApiGetRecoveryAddressChangeHashQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildRecoveryAddressChangeHashKey = ({
  to,
  deadline,
}: Partial<ApiGetRecoveryAddressChangeHashQueryParams> = {}) =>
  compactQueryKey(['recoveryAddressChangeHash', to, deadline]) as string[];

export { buildRecoveryAddressChangeHashKey };
