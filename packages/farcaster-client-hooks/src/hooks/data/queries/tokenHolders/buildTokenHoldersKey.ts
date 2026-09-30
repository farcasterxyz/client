import { ApiChain } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTokenHoldersKey = ({
  chain,
  ca,
  limit,
}: {
  chain: ApiChain;
  ca: string;
  limit?: number;
}) => compactQueryKey(['tokenHolders', chain, ca, limit]);

export { buildTokenHoldersKey };
