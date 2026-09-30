import { ApiGetWalletActivityQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildWalletActivityKey = ({
  fid,
  walletId,
  token,
  hideSpam,
  hideMicrotransactions,
  limit,
  chain,
}: Partial<ApiGetWalletActivityQueryParams> = {}) => {
  return compactQueryKey([
    'walletActivity',
    fid,
    token,
    { limit, hideSpam, hideMicrotransactions, walletId, chain },
  ]);
};

export { buildWalletActivityKey };
