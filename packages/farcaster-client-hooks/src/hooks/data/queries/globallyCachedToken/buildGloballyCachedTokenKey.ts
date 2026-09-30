import { ApiChain } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildGloballyCachedTokenKey = ({
  chain,
  ca,
}: {
  chain?: ApiChain;
  ca?: string;
} = {}) =>
  compactQueryKey([
    'globallyCachedToken',
    chain?.toLowerCase(),
    ca?.toLowerCase(),
  ]) as string[];

export { buildGloballyCachedTokenKey };
