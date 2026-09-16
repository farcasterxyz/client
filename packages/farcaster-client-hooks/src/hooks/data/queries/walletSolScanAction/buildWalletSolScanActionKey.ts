import { ApiSolSendTransactionRequest } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildWalletSolScanActionKey = ({
  account,
  action,
  domain,
  walletId,
}: {
  account: string;
  action: ApiSolSendTransactionRequest | undefined;
  domain: string;
  walletId?: string;
}) =>
  compactQueryKey([
    'walletSolScanAction',
    account,
    action ?? 'N/A',
    domain,
    walletId,
  ]);

export { buildWalletSolScanActionKey };
