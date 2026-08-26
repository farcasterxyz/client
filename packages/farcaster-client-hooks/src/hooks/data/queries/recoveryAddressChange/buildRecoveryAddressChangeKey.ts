import { ApiGetRecoveryAddressChangeQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildRecoveryAddressChangeKey = ({
  recoveryAddressChangeId,
}: Partial<ApiGetRecoveryAddressChangeQueryParams> = {}) =>
  compactQueryKey([
    'recoveryAddressChange',
    recoveryAddressChangeId,
  ]) as string[];

export { buildRecoveryAddressChangeKey };
