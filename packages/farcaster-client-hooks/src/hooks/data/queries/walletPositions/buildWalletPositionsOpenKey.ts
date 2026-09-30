import { ApiGetWalletPositionsOpenQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildWalletPositionsOpenKey = ({
  fid,
}: Partial<ApiGetWalletPositionsOpenQueryParams> = {}) =>
  compactQueryKey(['walletPositionsOpenV2', fid]) as string[];

export { buildWalletPositionsOpenKey };
