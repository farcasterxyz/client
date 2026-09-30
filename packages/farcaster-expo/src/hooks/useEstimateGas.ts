import { BaseError, ETHER_DECIMALS, isOpStack } from 'farcaster-client-data';
import {
  tokenQuantityToFloat,
  useFetchWalletChainNativeAsset,
  useWalletChainNativeAssetQuery,
} from 'farcaster-client-hooks';
import { useCallback, useMemo } from 'react';
import {
  Chain,
  EstimateGasErrorType,
  EstimateGasParameters,
  formatEther,
  Hex,
  parseEther,
} from 'viem';
import { EstimateL1FeeParameters } from 'viem/op-stack';
import {
  useBalance,
  useEstimateFeesPerGas,
  useEstimateGas as useEstimateGasWagmi,
} from 'wagmi';

import { useEmbeddedWallet, useSharedTelemetry } from '../contexts';
import { usePublicClient } from '../contexts/PublicClientProvider';
import { useEstimateL1Fee } from './useEstimateL1Fee';
import {
  SolanaFeeEstimateParams,
  useSolanaFeeEstimate,
} from './useSolanaFeeEstimate';

export type GasEstimate = {
  insufficientFundsToEstimate?: boolean;
  estimatedFeeGwei?: bigint;
  estimatedFeeShortfall?: bigint;
  estimatedFeeEth?: number;
  estimatedFeeUsd?: number;
  estimatedMaxFeePerGas?: bigint;
  estimatedMaxPriorityFeePerGas?: bigint;
  currentGasPrice?: bigint;
};

export type EstimateGasParams = {
  from: Hex;
  chain: Chain;
  to: Hex;
  data?: Hex;
  value?: bigint;
};

/**
 * @deprecated - use useEstimateGasQuery
 */
export const useEstimateGas = (): {
  estimateGas: (params: EstimateGasParams) => Promise<GasEstimate>;
} => {
  const { getEthereumClient, getL2EthereumClient } = usePublicClient();
  const fetchWalletChainNativeAsset = useFetchWalletChainNativeAsset();
  const { trackError } = useSharedTelemetry();

  const estimateGas = useCallback(
    async ({
      from,
      chain,
      to,
      data,
      value,
    }: EstimateGasParams): Promise<GasEstimate> => {
      try {
        let estimatedFeeGwei: bigint;
        let maxFeePerGas: bigint | undefined;
        let maxPriorityFeePerGas: bigint | undefined;
        let currentGasPrice: bigint | undefined;

        if (isOpStack(chain.id)) {
          const args = {
            account: from,
            to,
            data,
            value,
          };

          const publicClient = getL2EthereumClient({ chain });
          const request = await publicClient.prepareTransactionRequest({
            ...args,
            parameters: ['fees', 'nonce', 'type'],
          });

          const [l1Fee, l2Gas, l2GasPrice, fees] = await Promise.all([
            // @ts-expect-error - copied from viem codebase
            publicClient.estimateL1Fee(request as EstimateL1FeeParameters),
            publicClient.estimateGas({
              ...request,
              stateOverride: [
                {
                  address: from,
                  balance: parseEther('1'),
                },
              ],
            } as EstimateGasParameters),
            publicClient.getGasPrice(),
            publicClient.estimateFeesPerGas(),
          ]);

          estimatedFeeGwei = l1Fee + l2Gas * l2GasPrice;
          maxFeePerGas = fees.maxFeePerGas;
          maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
          currentGasPrice = l2GasPrice;
        } else {
          const publicClient = getEthereumClient({ chain });
          const [gas, fees, gasPrice] = await Promise.all([
            publicClient.estimateGas({
              account: from,
              to,
              data,
              value,
              stateOverride: [
                {
                  address: from,
                  balance: parseEther('1'),
                },
              ],
            }),
            publicClient.estimateFeesPerGas(),
            publicClient.getGasPrice(),
          ]);

          estimatedFeeGwei = gas * fees.maxFeePerGas;
          maxFeePerGas = fees.maxFeePerGas;
          maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
          currentGasPrice = gasPrice;
        }

        const estimatedFeeEth = parseFloat(formatEther(estimatedFeeGwei));

        const { data: nativeAsset } = await fetchWalletChainNativeAsset({
          chainId: chain.id,
        });

        return {
          estimatedFeeGwei,
          estimatedFeeEth,
          estimatedFeeUsd: nativeAsset?.price
            ? estimatedFeeEth * nativeAsset.price
            : undefined,
          estimatedMaxFeePerGas: maxFeePerGas,
          estimatedMaxPriorityFeePerGas: maxPriorityFeePerGas,
          currentGasPrice,
          insufficientFundsToEstimate: false,
        };
      } catch (e) {
        const err = e as EstimateGasErrorType;

        if (
          err.name === 'EstimateGasExecutionError' &&
          err.details.toLowerCase().includes('insufficient funds')
        ) {
          return {
            insufficientFundsToEstimate: true,
          };
        }

        trackError(
          new BaseError(`Failed to estimate gas`, {
            cause: err,
            name: 'EstimateGasError',
          }),
        );

        return {};
      }
    },
    [
      getEthereumClient,
      getL2EthereumClient,
      fetchWalletChainNativeAsset,
      trackError,
    ],
  );

  return {
    estimateGas,
  };
};

export type EstimateGasQueryParams = {
  account?: Hex;
  chainId?: number;
  to?: Hex;
  data?: Hex;
  value?: bigint;
  enabled?: boolean;
};

function createScopeKey(
  params: EstimateGasQueryParams,
  transactionCounterRef: number,
) {
  const key = `${params.account}-${params.chainId}-${params.to}-${params.data}-${params.value}-${transactionCounterRef}`;
  return key;
}

// If you are using this hook, you should prefetch walletChainNativeAsset so
// that by the time fee estimates are available a well-formed message can be
// displayed to users.
export function useEstimateGasQuery(args: EstimateGasQueryParams) {
  const enabled = args.enabled ?? true;
  const { transactionCounterRef } = useEmbeddedWallet();
  const { data: nativeAsset } = useWalletChainNativeAssetQuery({
    params: {
      chainId: args.chainId!,
    },
    query: {
      enabled,
    },
  });

  const { data: estimatedFeesPerGas, isPending: estimatedFeesPerGasIsPending } =
    useEstimateFeesPerGas({
      chainId: args.chainId,
      query: {
        refetchInterval: 1000 * 10,
        enabled,
      },
    });

  const {
    data: estimatedGas,
    error: estimatedGasError,
    isPending: estimatedGasIsPending,
  } = useEstimateGasWagmi({
    ...args,
    query: {
      enabled,
    },
  });

  const { data: nativeBalance } = useBalance({
    scopeKey: createScopeKey(args, transactionCounterRef.current),
    chainId: args.chainId,
    address: args.account,
    query: {
      refetchInterval: 1000 * 20,
      enabled,
    },
  });
  const isOp = isOpStack(args.chainId!);
  const { data: estimatedL1Fee, isPending: estimatedL1FeeIsPending } =
    useEstimateL1Fee({
      account: args.account!,
      to: args.to!,
      data: args.data!,
      value: args.value!,
      // Set this to 0 so we always get bac
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      chain: undefined,
      query: {
        enabled: isOp && enabled,
        refetchInterval: 1000 * 10,
      },
    });

  const insufficientFundsToEstimate = (() => {
    if (estimatedGasIsPending || (isOp && estimatedL1FeeIsPending)) {
      return;
    }

    return (
      estimatedGasError?.name === 'EstimateGasExecutionError' &&
      estimatedGasError.cause.name === 'InsufficientFundsError'
    );
  })();

  const estimatedFee = (() => {
    if (estimatedFeesPerGas !== undefined && estimatedGas !== undefined) {
      if (isOp && estimatedL1Fee !== undefined) {
        return estimatedL1Fee + estimatedGas * estimatedFeesPerGas.maxFeePerGas;
      }

      return estimatedGas * estimatedFeesPerGas.maxFeePerGas;
    }
  })();

  const estimatedFeeUsd =
    estimatedFee !== undefined && nativeAsset !== undefined
      ? nativeAsset.price *
        tokenQuantityToFloat({
          decimals: ETHER_DECIMALS,
          quantity: estimatedFee,
          strategy: 'exact',
        })
      : undefined;

  const estimatedFeeShortfall = (() => {
    if (
      estimatedFee === undefined ||
      nativeBalance === undefined ||
      (isOp && estimatedL1Fee === undefined)
    ) {
      return;
    }

    const shortfall = (args.value ?? 0n) + estimatedFee - nativeBalance.value;

    if (shortfall > 0n) {
      return shortfall;
    }

    return 0n;
  })();

  const insufficientFunds = (() => {
    if (insufficientFundsToEstimate === true) {
      return true;
    }

    if (estimatedFeeShortfall === undefined) {
      return;
    }

    return estimatedFeeShortfall > 0n;
  })();

  return {
    estimatedFeesPerGas,
    estimatedGas,
    estimatedFee,
    estimatedFeeUsd,
    estimatedFeeShortfall,
    insufficientFundsToEstimate,
    insufficientFunds,
    nativeAsset,
    isPending:
      estimatedGasIsPending &&
      estimatedFeesPerGasIsPending &&
      isOp &&
      estimatedL1FeeIsPending,
  };
}

type UnifiedFeeEstimateParams =
  | {
      protocol: 'evm';
      params: EstimateGasQueryParams;
    }
  | {
      protocol: 'solana';
      params: SolanaFeeEstimateParams;
    };

export function useUnifiedFeeEstimate(args: UnifiedFeeEstimateParams) {
  const { protocol, params } = args;

  const evmResult = useEstimateGasQuery(
    protocol === 'evm' ? params : { enabled: false },
  );

  const solanaResult = useSolanaFeeEstimate(
    protocol === 'solana' ? params : { enabled: false },
  );
  const rewrittenSolanaResult = useMemo(
    () => ({
      isPending: solanaResult.isLoading,
      estimatedFee: solanaResult.estimatedFee
        ? BigInt(Math.floor(solanaResult.estimatedFee))
        : undefined,
      estimatedFeeUsd: solanaResult.estimatedFeeUsd,
    }),
    [solanaResult],
  );

  return protocol === 'evm' ? evmResult : rewrittenSolanaResult;
}
