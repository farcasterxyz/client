import {
  ApiChainId,
  ApiEthereumAddress,
  ApiFarcasterWalletAction,
} from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildWalletEvmScanActionKey = ({
  account,
  chainId,
  action,
  domain,
  walletId,
}: {
  account: ApiEthereumAddress;
  chainId: ApiChainId;
  action: ApiFarcasterWalletAction;
  domain: string;
  walletId?: string;
}) =>
  compactQueryKey([
    'walletEvmScanAction',
    account,
    chainId,
    action,
    domain,
    walletId,
  ]);

export { buildWalletEvmScanActionKey };
