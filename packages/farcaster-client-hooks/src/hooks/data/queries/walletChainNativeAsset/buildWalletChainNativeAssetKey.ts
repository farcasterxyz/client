import { ApiGetWalletChainNativeAssetQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export type BuildWalletChainNativeAssetKey = ReturnType<
  typeof buildWalletChainNativeAssetKey
>;

const buildWalletChainNativeAssetKey = ({
  chainId,
}: Partial<ApiGetWalletChainNativeAssetQueryParams> = {}) =>
  compactQueryKey(['walletChainNativeAsset', chainId]);

export { buildWalletChainNativeAssetKey };
