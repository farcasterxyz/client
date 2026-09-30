import { ApiGetTokenWalletContextQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildTokenWalletContextKey = ({
  fid,
  chain,
  ca,
  walletId,
}: ApiGetTokenWalletContextQueryParams) =>
  compactQueryKey(['walletToken', { chain, ca }, fid, walletId]);
