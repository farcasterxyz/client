import { ApiTotpTokenContext } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildGloballyCachedTotpTokenKey = ({
  context,
}: {
  context?: ApiTotpTokenContext;
} = {}) => compactQueryKey(['globallyCachedTotpToken', context]) as string[];

export { buildGloballyCachedTotpTokenKey };
