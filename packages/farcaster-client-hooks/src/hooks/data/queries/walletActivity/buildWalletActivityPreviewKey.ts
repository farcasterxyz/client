import { ApiGetWalletActivityQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildWalletActivityPreviewKey = ({
  fid,
  walletId,
  hideSpam,
  hideMicrotransactions,
  token,
  chain,
}: Partial<ApiGetWalletActivityQueryParams> = {}) => {
  return compactQueryKey([
    'walletActivityPreview',
    fid,
    hideSpam,
    hideMicrotransactions,
    token,
    walletId,
    chain,
  ]);
};

export { buildWalletActivityPreviewKey };
