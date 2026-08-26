import { compactQueryKey } from '../../../../utils';

const buildSwapTokensForGasKey = ({
  chainId,
  sellAmountBaseUnits,
  sellToken,
  walletId,
}: {
  chainId?: number;
  sellAmountBaseUnits?: string;
  sellToken?: string;
  walletId?: string;
}) =>
  compactQueryKey([
    'swapTokensForGas',
    chainId ?? 0,
    sellAmountBaseUnits ?? 'N/A',
    sellToken ?? 'N/A',
    walletId ?? 'default',
  ]);

export { buildSwapTokensForGasKey };
