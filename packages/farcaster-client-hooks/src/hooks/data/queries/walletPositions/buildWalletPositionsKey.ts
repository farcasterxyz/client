import { ApiGetWalletPositionsQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildWalletPositionsKey = ({
  fid,
  address,
  walletId,
}: Partial<ApiGetWalletPositionsQueryParams> = {}) =>
  compactQueryKey(['walletPositions', fid, address, walletId]) as string[];

export { buildWalletPositionsKey };
