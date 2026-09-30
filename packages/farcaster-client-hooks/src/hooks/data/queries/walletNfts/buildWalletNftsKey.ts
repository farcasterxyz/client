import { ApiGetWalletNftsQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildWalletNftsKey = ({
  fid,
  address,
}: Partial<ApiGetWalletNftsQueryParams> = {}) =>
  compactQueryKey(['walletNfts', fid, address]);

export { buildWalletNftsKey };
