import { ApiSwapToken, ETHER_DECIMALS, isOpStack } from 'farcaster-client-data';
import {
  tokenQuantityToFloat,
  useWalletChainNativeAssetQuery,
} from 'farcaster-client-hooks';
import { zeroAddress } from 'viem';
import { useEstimateFeesPerGas } from 'wagmi';

import { assertHex } from '../utils';
import { useEstimateL1Fee } from './useEstimateL1Fee';

export interface EstimateGasQuantityParams {
  estimatedGas?: bigint;
  chainId?: number;
  account?: string;
}

export interface EstimateGasQuantityResult {
  isLoading: boolean;
  canEstimate: boolean;
  estimatedFee?: bigint;
  estimatedFeeUsd?: number;
  estimatedFeesPerGas?: {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  };
  nativeAsset?: ApiSwapToken;
  error?: Error;
}
export function useTotalEvmGasFeeEstimate({
  estimatedGas,
  chainId,
  account,
}: EstimateGasQuantityParams): EstimateGasQuantityResult {
  const isOp = chainId ? isOpStack(chainId) : false;
  const { data: nativeAsset } = useWalletChainNativeAssetQuery({
    params: {
      chainId: chainId ?? 0,
    },
    query: {
      enabled: !!chainId,
    },
  });

  const {
    data: estimatedFeesPerGas,
    isPending: estimatedFeesPerGasIsPending,
    error: estimatedFeesPerGasError,
  } = useEstimateFeesPerGas({
    chainId,
    query: {
      refetchInterval: 1000 * 10,
    },
  });

  const {
    data: estimatedL1Fee,
    isPending: estimatedL1FeeIsPending,
    error: estimatedL1FeeError,
  } = useEstimateL1Fee({
    account: assertHex(account ?? zeroAddress),
    gas: estimatedGas,
    maxFeePerGas: 0n,
    maxPriorityFeePerGas: 0n,
    chain: undefined,
    query: {
      enabled: isOp,
      refetchInterval: 1000 * 10,
    },
  });

  if (!estimatedGas) {
    return {
      isLoading: false,
      canEstimate: false,
    };
  }

  // Handle errors
  if (estimatedL1FeeError || estimatedFeesPerGasError) {
    const combinedError = estimatedL1FeeError ?? estimatedFeesPerGasError;
    return {
      isLoading: false,
      canEstimate: false,
      error: combinedError as Error,
    };
  }

  // Handle loading states
  const isLoading =
    estimatedFeesPerGasIsPending ||
    (isOp && estimatedL1FeeIsPending) ||
    estimatedFeesPerGas === undefined ||
    (isOp && estimatedL1Fee === undefined);

  if (isLoading) {
    return { isLoading: true, canEstimate: false };
  }

  let estimatedFee = estimatedGas * estimatedFeesPerGas!.maxFeePerGas;
  if (isOp && estimatedL1Fee !== undefined) {
    estimatedFee += estimatedL1Fee;
  }

  const estimatedFeeUsd =
    estimatedFee !== undefined && nativeAsset !== undefined
      ? nativeAsset.price *
        tokenQuantityToFloat({
          decimals: ETHER_DECIMALS,
          quantity: estimatedFee,
          strategy: 'exact',
        })
      : undefined;

  return {
    isLoading: false,
    canEstimate: true,
    nativeAsset,
    estimatedFee,
    estimatedFeeUsd,
    estimatedFeesPerGas,
  };
}
