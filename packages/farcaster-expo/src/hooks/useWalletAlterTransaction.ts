// TODO: use better types to remove disable.
import { apiChainToViemChainOrThrow, isOpStack } from 'farcaster-client-data';
import { useFetchWalletChainNativeAsset } from 'farcaster-client-hooks';
import { useCallback, useState } from 'react';
import { Chain, formatEther, Hex, parseEther } from 'viem';
import { z } from 'zod';

import { useEmbeddedWallet, useSharedTelemetry } from '../contexts';
import { usePublicClient } from '../contexts/PublicClientProvider';
import { assertHex } from '../utils/DataUtils';
import { logErrorInDevOnly } from '../utils/LogUtils';
import { useEstimateGas } from './useEstimateGas';

// Define the RequestObject schema
const HexSchema = z
  .string()
  .regex(
    /^0x[0-9a-fA-F]*$/,
    'Invalid hex string. Must start with 0x followed by hex characters',
  )
  .transform((val): `0x${string}` => val as `0x${string}`);

export const ViemTransactionSchema = z.object({
  type: z.literal('eip1559'),
  chainId: z.number(),
  gas: z.bigint(),
  nonce: z.number(),
  maxFeePerGas: z.bigint(),
  maxPriorityFeePerGas: z.bigint(),
  data: HexSchema.optional(),
  from: HexSchema,
  to: HexSchema,
  value: z.bigint().optional(),
});

export type ViemTransaction = z.infer<typeof ViemTransactionSchema>;

export type AlterTransactionState =
  | 'pending'
  | 'succeeded'
  | 'reverted'
  | 'error-sending'
  | 'error-monitoring';

export type AlterTransactionResult = {
  txHash?: Hex;
  state: AlterTransactionState;
  error?: Error;
};

const DEFAULT_PERCENT_INCREASE = 20n;
const MIN_PRIORITY_FEE_WEI = parseEther('0.2', 'gwei');

const formatBigIntEther = (value: bigint): number => {
  return Number(formatEther(value));
};

const getIncreasedPrice = (
  price: bigint | string,
  percent: bigint = DEFAULT_PERCENT_INCREASE,
) => {
  if (typeof price === 'string') {
    if (price.startsWith('0x')) {
      price = BigInt(parseInt(price, 16));
    } else {
      price = BigInt(price);
    }
  }
  return (price * (100n + percent)) / 100n;
};

type CachedTransaction = {
  txHash: Hex;
  transaction: ViemTransaction;
};

const DEFAULT_GAS_LIMIT = 21000n;

const estimateBaseFee = (
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
): bigint => {
  // In EIP-1559, base fee + priority fee <= max fee
  // We can estimate base fee by subtracting priority fee from max fee
  // and ensuring it's not negative
  const estimatedBaseFee =
    maxFeePerGas > maxPriorityFeePerGas
      ? maxFeePerGas - maxPriorityFeePerGas
      : 0n;

  return estimatedBaseFee;
};

/**
 * Validates that a replacement transaction preserves all original transaction fields
 * except for the gas pricing parameters.
 *
 * @param originalTx - The original transaction
 * @param newTx - The new transaction with updated gas parameters
 * @returns Boolean indicating whether the transaction fields match
 */
function validateTransactionReplacement(
  originalTx: ViemTransaction,
  newTx: ViemTransaction,
  isCancel: boolean,
): boolean {
  const fromMatch =
    originalTx.from?.toLowerCase() === newTx.from?.toLowerCase();
  const toMatch = isCancel
    ? newTx.to?.toLowerCase() === newTx.from?.toLowerCase()
    : originalTx.to?.toLowerCase() === newTx.to?.toLowerCase();

  let dataMatch = false;
  let valueMatch = false;
  let gasMatch = false;
  if (isCancel) {
    dataMatch = newTx.data === undefined;
    valueMatch = newTx.value === 0n;
    gasMatch = newTx.gas === DEFAULT_GAS_LIMIT;
  } else {
    dataMatch = originalTx.data === newTx.data;
    valueMatch = originalTx.value === newTx.value;
    gasMatch = originalTx.gas === newTx.gas;
  }

  // Check if at least one of the gas parameters has increased
  const nonceMatch = originalTx.nonce === newTx.nonce;
  const maxFeeIncreased =
    !originalTx.maxFeePerGas || !newTx.maxFeePerGas
      ? false
      : BigInt(newTx.maxFeePerGas) > BigInt(originalTx.maxFeePerGas);

  const maxPriorityFeeIncreased =
    !originalTx.maxPriorityFeePerGas || !newTx.maxPriorityFeePerGas
      ? false
      : BigInt(newTx.maxPriorityFeePerGas) >
        BigInt(originalTx.maxPriorityFeePerGas);

  const gasParamsIncreased = maxFeeIncreased || maxPriorityFeeIncreased;
  if (!originalTx.from || !newTx.from || !originalTx.to || !newTx.to) {
    return false;
  }

  // Return simple boolean result
  const result =
    fromMatch &&
    toMatch &&
    dataMatch &&
    valueMatch &&
    nonceMatch &&
    gasMatch &&
    gasParamsIncreased;
  return result;
}

export const useWalletAlterTransaction = () => {
  const { getEthereumClient, getL2EthereumClient } = usePublicClient();
  const {
    getWalletClient,
    evmAddress,
    removePendingTransaction,
    getPendingTransaction,
  } = useEmbeddedWallet();
  const fetchWalletChainNativeAsset = useFetchWalletChainNativeAsset();
  const [cachedTransactions, setCachedTransactions] = useState<
    CachedTransaction[]
  >([]);
  const { estimateGas } = useEstimateGas();
  const { trackError } = useSharedTelemetry();

  const getUpdatedGasSettings = useCallback(
    async ({
      tx,
      chain,
      minPriorityFee,
    }: {
      tx: ViemTransaction;
      chain: Chain;
      minPriorityFee?: bigint;
    }): Promise<{
      maxFeePerGas: bigint;
      maxPriorityFeePerGas: bigint;
      gas: bigint;
    }> => {
      try {
        const {
          estimatedFeeGwei,
          estimatedMaxFeePerGas,
          estimatedMaxPriorityFeePerGas,
        } = await estimateGas({
          from: assertHex(evmAddress),
          chain,
          to: tx.to as Hex,
          data: tx.data as Hex | undefined,
          value: tx.value ?? undefined,
        });

        if (tx.type !== 'eip1559') {
          throw new Error('Transaction is not EIP-1559');
        }
        // Code below is exclusively for  EIP-1559 transactions
        const minRequiredFee = getIncreasedPrice(tx.maxFeePerGas);
        const minRequiredPriority = getIncreasedPrice(tx.maxPriorityFeePerGas!);

        const estimatedGasPrice =
          (estimatedFeeGwei ?? 0n) / (tx.gas ?? DEFAULT_GAS_LIMIT);

        let finalMaxFeePerGas = [
          minRequiredFee,
          estimatedMaxFeePerGas ?? 0n,
          estimatedGasPrice,
        ].reduce((a, b) => (a > b ? a : b));

        let finalMaxPriorityFeePerGas = [
          minRequiredPriority,
          estimatedMaxPriorityFeePerGas ?? 0n,
        ].reduce((a, b) => (a > b ? a : b));

        if (minPriorityFee && minPriorityFee > finalMaxPriorityFeePerGas) {
          const baseFee = estimateBaseFee(
            finalMaxFeePerGas,
            finalMaxPriorityFeePerGas,
          );
          finalMaxPriorityFeePerGas = minPriorityFee;
          finalMaxFeePerGas = baseFee + minPriorityFee;
        }

        return {
          gas: tx.gas ?? DEFAULT_GAS_LIMIT,
          maxFeePerGas: finalMaxFeePerGas,
          maxPriorityFeePerGas: finalMaxPriorityFeePerGas,
        };
      } catch (e) {
        // If estimation fails, fall back to just increasing the original values
        return {
          gas: tx.gas ?? DEFAULT_GAS_LIMIT,
          maxFeePerGas: getIncreasedPrice(tx.maxFeePerGas),
          maxPriorityFeePerGas: getIncreasedPrice(tx.maxPriorityFeePerGas!),
        };
      }
    },
    [evmAddress, estimateGas],
  );

  const getTransaction = useCallback(
    async (txHash: Hex, chain: Chain): Promise<ViemTransaction | undefined> => {
      const cached = cachedTransactions.find((ct) => ct.txHash === txHash);
      if (cached) {
        return cached.transaction;
      }

      const publicClient = isOpStack(chain.id)
        ? getL2EthereumClient({ chain })
        : getEthereumClient({ chain });

      try {
        const rawTransaction = await publicClient.getTransaction({
          hash: txHash,
        });
        if (rawTransaction.type !== 'eip1559') {
          logErrorInDevOnly(
            `Dropping transaction ${txHash} because it is not EIP-1559. This should never happen.`,
          );
          return undefined;
        }

        const transaction: ViemTransaction = ViemTransactionSchema.parse({
          ...rawTransaction,
          data: rawTransaction.input,
        });

        setCachedTransactions((prev) => [
          ...prev,
          {
            txHash,
            transaction,
          },
        ]);

        return transaction;
      } catch (e) {
        logErrorInDevOnly(`Failed to get transaction ${txHash}: ${e}`);
        return undefined;
      }
    },
    [cachedTransactions, getL2EthereumClient, getEthereumClient],
  );

  const cancelPendingTransaction = useCallback(
    async (txHash: Hex): Promise<AlterTransactionResult> => {
      const pendingTx = getPendingTransaction(txHash);
      if (!pendingTx.exists) {
        const error = new Error('Transaction not found');
        return {
          state: 'error-sending',
          error,
        };
      }

      const chain = apiChainToViemChainOrThrow(pendingTx.chain);
      const publicClient = isOpStack(chain.id)
        ? getL2EthereumClient({ chain })
        : getEthereumClient({ chain });

      let cancelTxHash: Hex;
      try {
        const originalTx = await getTransaction(txHash, chain);
        if (!originalTx) {
          const error = new Error('Transaction not found');
          return {
            state: 'error-sending',
            error,
          };
        }

        const walletClient = await getWalletClient(chain);
        const txGasSettings = await getUpdatedGasSettings({
          tx: originalTx,
          chain,
          minPriorityFee: MIN_PRIORITY_FEE_WEI,
        });
        const newTx = ViemTransactionSchema.parse({
          ...txGasSettings,
          type: 'eip1559',
          chainId: originalTx.chainId,
          from: originalTx.from,
          to: originalTx.from,
          nonce: originalTx.nonce,
          value: 0n,
          data: undefined,
          gas: DEFAULT_GAS_LIMIT,
        });
        if (!validateTransactionReplacement(originalTx, newTx, true)) {
          const error = new Error('Transaction replacement validation failed');
          return {
            state: 'error-sending',
            error,
          };
        }
        cancelTxHash = await walletClient.sendTransaction(newTx);
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Unknown error');
        trackError(
          new Error(`error sending cancel transaction: ${error.message}`, {
            cause: error,
          }),
        );
        return {
          state: 'error-sending',
          error,
        };
      }

      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: cancelTxHash,
        });
        if (receipt.status === 'success') {
          await removePendingTransaction(txHash);
          return {
            txHash: cancelTxHash,
            state: 'succeeded',
          };
        } else {
          return {
            txHash: cancelTxHash,
            state: 'reverted',
          };
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Unknown error');
        trackError(
          new Error(
            `error monitoring cancel transaction ${cancelTxHash}: ${error.message}`,
            {
              cause: error,
            },
          ),
        );
        return {
          txHash: cancelTxHash,
          state: 'error-monitoring',
          error,
        };
      }
    },
    [
      getTransaction,
      getPendingTransaction,
      getWalletClient,
      getUpdatedGasSettings,
      removePendingTransaction,
      trackError,
      getL2EthereumClient,
      getEthereumClient,
    ],
  );

  const speedUpPendingTransaction = useCallback(
    async (txHash: Hex): Promise<AlterTransactionResult> => {
      const pendingTx = getPendingTransaction(txHash);
      if (!pendingTx.exists) {
        const error = new Error('Transaction not found');
        return {
          state: 'error-sending',
          error,
        };
      }

      const chain = apiChainToViemChainOrThrow(pendingTx.chain);
      const publicClient = isOpStack(chain.id)
        ? getL2EthereumClient({ chain })
        : getEthereumClient({ chain });

      let speedUpTxHash: Hex;
      try {
        const originalTx = await getTransaction(txHash, chain);
        if (!originalTx) {
          const error = new Error('Transaction not found');
          return {
            state: 'error-sending',
            error,
          };
        }
        const walletClient = await getWalletClient(chain);
        const txGasSettings = await getUpdatedGasSettings({
          tx: originalTx,
          chain,
        });

        const newTransaction = ViemTransactionSchema.parse({
          ...originalTx,
          maxFeePerGas: txGasSettings.maxFeePerGas,
          maxPriorityFeePerGas: txGasSettings.maxPriorityFeePerGas,
        });

        const isValidReplacement = validateTransactionReplacement(
          originalTx,
          newTransaction,
          false,
        );
        if (!isValidReplacement) {
          const error = new Error(
            'Transaction fields do not match original or gas parameters not increased',
          );
          return {
            state: 'error-sending',
            error,
          };
        }

        speedUpTxHash = await walletClient.sendTransaction(newTransaction);
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Unknown error');
        trackError(
          new Error(`error sending speed up transaction: ${error.message}`, {
            cause: error,
          }),
        );
        return {
          state: 'error-sending',
          error,
        };
      }

      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: speedUpTxHash,
        });
        if (receipt.status === 'success') {
          await removePendingTransaction(txHash);
          return {
            txHash: speedUpTxHash,
            state: 'succeeded',
          };
        } else {
          return {
            txHash: speedUpTxHash,
            state: 'reverted',
          };
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Unknown error');
        trackError(
          new Error(
            `error monitoring speed up transaction ${speedUpTxHash}: ${error.message}`,
            {
              cause: error,
            },
          ),
        );
        return {
          txHash: speedUpTxHash,
          state: 'error-monitoring',
          error,
        };
      }
    },
    [
      getPendingTransaction,
      getTransaction,
      getWalletClient,
      getUpdatedGasSettings,
      removePendingTransaction,
      trackError,
      getL2EthereumClient,
      getEthereumClient,
    ],
  );

  const estimateRepriceGas = useCallback(
    async (txHash: Hex, operation: 'cancel' | 'speedUp', asDelta?: boolean) => {
      const pendingTx = getPendingTransaction(txHash);
      if (!pendingTx.exists) {
        return undefined;
      }

      const chain = apiChainToViemChainOrThrow(pendingTx.chain);
      try {
        const [{ data: nativeAsset }, originalTx] = await Promise.all([
          fetchWalletChainNativeAsset({
            chainId: chain.id,
          }),
          getTransaction(txHash, chain),
        ]);

        if (!originalTx) {
          return undefined;
        }

        const updatedGasSettings = await getUpdatedGasSettings({
          tx: originalTx,
          chain,
          minPriorityFee:
            operation === 'cancel' ? MIN_PRIORITY_FEE_WEI : undefined,
        });

        if (!updatedGasSettings) {
          return undefined;
        }

        // Calculate total fee by multiplying price by gas limit
        const estimatedFeeGwei =
          updatedGasSettings.maxFeePerGas * updatedGasSettings.gas;
        if (estimatedFeeGwei === 0n) {
          return undefined;
        }

        if (asDelta) {
          let gasPrice = originalTx.maxFeePerGas;
          if (!gasPrice) {
            const { currentGasPrice } = await estimateGas({
              from: assertHex(evmAddress),
              chain,
              to: originalTx.to as Hex,
              data: originalTx.data as Hex | undefined,
              value: originalTx.value,
            });
            gasPrice = currentGasPrice ?? 1n;
          }

          const originalGas = isOpStack(chain.id)
            ? gasPrice * originalTx.gas
            : originalTx.maxFeePerGas
              ? originalTx.maxFeePerGas * originalTx.gas
              : gasPrice * originalTx.gas;

          const gasDelta = estimatedFeeGwei - BigInt(originalGas);
          const gasDeltaEth = formatBigIntEther(gasDelta);

          return {
            estimatedFeeGwei: gasDelta,
            estimatedFeeEth: gasDeltaEth,
            estimatedFeeUsd: nativeAsset
              ? gasDeltaEth * nativeAsset.price
              : undefined,
            isDelta: true,
          };
        }

        const estimatedFeeEth = formatBigIntEther(estimatedFeeGwei);

        return {
          estimatedFeeGwei: estimatedFeeGwei,
          estimatedFeeEth: estimatedFeeEth,
          estimatedFeeUsd: nativeAsset
            ? estimatedFeeEth * nativeAsset.price
            : undefined,
          isDelta: false,
        };
      } catch (error) {
        trackError(
          error instanceof Error
            ? error
            : new Error('Unknown error estimating speed up gas'),
        );
        return undefined;
      }
    },
    [
      getPendingTransaction,
      fetchWalletChainNativeAsset,
      getTransaction,
      getUpdatedGasSettings,
      estimateGas,
      evmAddress,
      trackError,
    ],
  );

  return {
    cancelPendingTransaction,
    speedUpPendingTransaction,
    estimateRepriceGas,
  };
};
