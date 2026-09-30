import {
  ApiChain,
  ApiFarcasterWalletAction,
  getChain,
} from 'farcaster-client-data';
import { encodeFunctionData, erc4626Abi } from 'viem';

import { useEstimateGasQuery } from './useEstimateGas';

export const useMorphoWithdrawal = ({
  chain,
  ca,
  address,
  amount,
  shares = false,
  enabled = true,
}: {
  chain: ApiChain;
  ca: string;
  address: string;
  amount: bigint;
  shares?: boolean;
  enabled?: boolean;
}) => {
  const txParams = {
    chainId: getChain(chain).getEnsuredChainId().toString(),
    to: ca,
    data: encodeFunctionData({
      abi: erc4626Abi,
      functionName: shares ? 'redeem' : 'withdraw',
      args: [amount, address as `0x${string}`, address as `0x${string}`],
    }),
    value: '0',
  };

  const {
    estimatedFeeUsd,
    isPending: estimatedFeeUsdPending,
    insufficientFunds,
  } = useEstimateGasQuery({
    chainId: getChain(chain).getEnsuredChainId(),
    account: address as `0x${string}`,
    to: ca as `0x${string}`,
    data: txParams.data,
    value: 0n,
    enabled: enabled && amount > 0n,
  });

  const data: ApiFarcasterWalletAction[] = [];
  data.push({ method: 'eth_sendTransaction', params: txParams });

  return { data, estimatedFeeUsd, insufficientFunds, estimatedFeeUsdPending };
};
