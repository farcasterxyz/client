import { SolanaCombinedTransaction } from '@farcaster/miniapp-core';
import { VersionedTransaction } from '@solana/web3.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiCast,
  ApiCastCollectibleAuctionBid,
  ApiChain,
  apiChainToViemChainOrThrow,
  ApiEthFungibleTokenPosition,
  ApiFarcasterWalletAction,
  ApiOnchainMorphoDepositTransactionMetadata,
  ApiOnchainMorphoWithdrawTransactionMetadata,
  ApiOnchainTxExecute,
  ApiOnchainTxExecuteStatus,
  ApiOnchainTxExecuteSwapJupiterUltra,
  ApiOnchainYieldDepositTransactionMetadata,
  ApiOnchainYieldWithdrawTransactionMetadata,
  ApiSwapQuote,
  ApiWalletSendTarget,
  ApiWalletSwapV2TransactionMetadata,
  getWaitForTransactionReceiptTimeoutForChain,
} from 'farcaster-client-data';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Chain,
  concat,
  ContractFunctionExecutionError,
  Hex,
  InternalRpcError,
  JsonRpcAccount,
  keccak256,
  MethodNotFoundRpcError,
  numberToHex,
  parseSignature,
  PublicClient,
  SendTransactionParameters,
  serializeCompactSignature,
  signatureToCompactSignature,
  SignTypedDataParameters,
  size,
  TransactionExecutionError,
  WaitForTransactionReceiptErrorType,
  WalletClient,
  withRetry,
} from 'viem';

import {
  executeQuoteAsync,
  waitForQuoteToComplete,
} from '../hooks/useExecuteSwapForGas';
import { useHaptics } from '../hooks/useHaptics';
import { SolanaWalletProviderWithConn } from '../types';
import { solanaConnection } from '../utils';
import { waitForSolanaTransaction } from '../utils/SolanaUtils';
import { useEmbeddedWallet } from './EmbeddedWalletContext';
import { usePublicClient } from './PublicClientProvider';
import { useRootToast } from './RootToastProvider';
import {
  CreateStepTracker,
  useSharedTelemetry,
  useStepTracker,
} from './SharedTelemetryContext';
import { useSharedWalletSwapStatusContext } from './SharedWalletSwapStatusContext';
import { assertFinancialImpactAllowed } from './walletFinancialImpactGuard';

const SKIP_SIMULATION_CHAINS = ['arbitrum', 'unichain', 'solana'];

const RETRY_COUNT = 10;

/**
 * Emits a lightweight, PII-free RUM action at each wallet-transaction lifecycle
 * transition so we can see *where* a swap stalls on mobile (prepare → submit →
 * process → execute). `flow_id` correlates a single attempt across phases, so in
 * Datadog you can group by `@context.flow_id` and read off the last phase
 * reached.
 *
 * GUARDRAIL: never pass signatures, calldata, amounts/values, full
 * addresses, quote payloads, or any key/recovery material here — only phase
 * names, booleans, counts, timings, chain/type, and sanitized error names.
 */
type LifecycleLogger = (
  phase: string,
  context?: Record<string, string | number | boolean | undefined>,
) => void;

let flowCounter = 0;
const generateFlowId = () =>
  `${Date.now().toString(36)}-${(flowCounter++).toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'reverted';

const SIWF_DEBUG = (() => {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.location?.search?.includes('debug-swap=1') ||
      window.localStorage?.getItem('debug-swap') === '1'
    );
  } catch {
    return false;
  }
})();
const siwfLog = (...args: unknown[]) => {
  if (!SIWF_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log('[swap-debug][WalletTransactionsProvider]', ...args);
};

class SimulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SimulationError';
  }
}

class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

const isAlreadyKnownTransactionError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : String(error ?? 'unknown');
  return message.toLowerCase().includes('already known');
};

const extractRawTransactionFromAlreadyKnownError = (
  error: unknown,
): Hex | undefined => {
  if (!isAlreadyKnownTransactionError(error)) {
    return undefined;
  }

  const candidates: unknown[] = [];
  const collectCandidates = (value: unknown, depth = 0) => {
    if (!value || depth > 3) {
      return;
    }
    if (typeof value === 'string') {
      candidates.push(value);
      return;
    }
    if (typeof value !== 'object') {
      return;
    }

    const record = value as Record<string, unknown>;
    candidates.push(record.message, record.details, record.shortMessage);
    collectCandidates(record.requestBody, depth + 1);
    collectCandidates(record.body, depth + 1);
    collectCandidates(record.cause, depth + 1);
    collectCandidates(record.error, depth + 1);
  };

  collectCandidates(error);

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }

    try {
      const request = JSON.parse(candidate);
      if (
        request?.method === 'eth_sendRawTransaction' &&
        typeof request?.params?.[0] === 'string'
      ) {
        return request.params[0] as Hex;
      }
    } catch {
      // Fall back to regex extraction below.
    }

    const match = candidate.match(
      /eth_sendRawTransaction[\s\S]{0,5000}["\\](0x(?:02|01)?f[0-9a-fA-F]{100,})["\\]/,
    );
    if (match?.[1]) {
      return match[1] as Hex;
    }
  }

  return undefined;
};

type SendTransactionMetadata = {
  type: 'send';
  token: ApiEthFungibleTokenPosition;
  target: ApiWalletSendTarget;
  quantity: string;
};

type SwapTransactionMetadata = {
  type: 'swap';
  quote: ApiSwapQuote;
};

type SwapTransactionMetadataV2 = Omit<
  ApiWalletSwapV2TransactionMetadata,
  'status' | 'error'
>;

type DecompressTransactionMetadata = {
  type: 'decompress';
  view: 'on-claim' | 'view-token';
  token?: ApiEthFungibleTokenPosition;
};

export type BidTransactionMetadata = {
  type: 'bid';
  cast: ApiCast;
  bid: ApiCastCollectibleAuctionBid;
};

type UnwrapTransactionMetadata = {
  type: 'unwrap';
};

type LimitOrderApprovalTransactionMetadata = {
  type: 'limit-order-approval';
  tokenCa: string;
  tokenTicker: string;
};

export type SubmitTransactionMetadata =
  | SendTransactionMetadata
  | SwapTransactionMetadata
  | SwapTransactionMetadataV2
  | DecompressTransactionMetadata
  | BidTransactionMetadata
  | UnwrapTransactionMetadata
  | LimitOrderApprovalTransactionMetadata
  | Omit<ApiOnchainYieldDepositTransactionMetadata, 'status' | 'error'>
  | Omit<ApiOnchainYieldWithdrawTransactionMetadata, 'status' | 'error'>
  | Omit<ApiOnchainMorphoDepositTransactionMetadata, 'status' | 'error'>
  | Omit<ApiOnchainMorphoWithdrawTransactionMetadata, 'status' | 'error'>;

type BaseTransactionOptions = {
  chain: ApiChain;
  metadata: SubmitTransactionMetadata;
  onExecute?: () => Promise<void> | void;
  onSuccess?: (txHash: string, txId: string) => Promise<void> | void;
  onError?: (error?: Error, txHash?: string) => Promise<void> | void;
  onProcessed?: (txHash: string) => Promise<void> | void;
  toast?: boolean;
  disableHaptics?: boolean;
};

type SolanaTransactionOptions = BaseTransactionOptions & {
  protocol: 'solana';
  buildTransaction: () => Promise<SolanaCombinedTransaction>;
};

type EvmTransactionOptions = BaseTransactionOptions & {
  protocol: 'ethereum';
  buildTransaction: () => Promise<SendTransactionParameters>;
};

type EvmGaslessTransactionOptions = BaseTransactionOptions & {
  protocol: 'ethereum-gasless';
  buildTransaction: () => Promise<{
    quote: ApiSwapQuote;
    requestId?: string;
  }>;
};

export type WalletExecutable = {
  execute: () => Promise<{ result: 'reverted' | 'confirmed'; txHash: string }>;
  destroy: () => void;
  /** Correlates this attempt's lifecycle events across prepare → execute. */
  flowId: string;
};

type TransactionRequest = {
  type: 'eip1559';
  account: JsonRpcAccount;
  to: Hex;
  nonce: number;
  data: Hex;
  value: bigint;
  chain: Chain;
  gas: bigint | undefined;
  maxFeePerGas: bigint | undefined;
  maxPriorityFeePerGas: bigint | undefined;
};

type PreviousFees = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

const buildWalletExecutable = (options: {
  tx: ActionsTransactionOptions;
  publicClient: PublicClient;
  solanaWalletProvider: SolanaWalletProviderWithConn;
  getWalletClient: (forceReconnect?: boolean) => Promise<WalletClient>;
  createStepTracker: CreateStepTracker;
  logLifecycle: LifecycleLogger;
  previousFees?: PreviousFees;
  setPreviousFees?: (previousFees: PreviousFees) => void;
  executeOnchainTx: (
    tx: ApiOnchainTxExecute,
  ) => Promise<ApiOnchainTxExecuteStatus>;
}): WalletExecutable => {
  const flowId = generateFlowId();
  const { tx, logLifecycle } = options;

  logLifecycle('prepare_created', {
    flow_id: flowId,
    tx_chain: tx.chain,
    tx_type: tx.metadata.type,
    swap_source:
      tx.metadata.type === 'swap-v2' ? tx.metadata.quote.source : undefined,
  });

  if (tx.chain === 'solana') {
    return buildSolanaExecutable({ ...options, flowId });
  }

  return buildEthereumExecutable({ ...options, flowId });
};

const buildEthereumExecutable = ({
  tx,
  publicClient,
  getWalletClient,
  createStepTracker,
  logLifecycle,
  flowId,
  previousFees,
  setPreviousFees,
}: {
  tx: ActionsTransactionOptions;
  publicClient: PublicClient;
  getWalletClient: (forceReconnect?: boolean) => Promise<WalletClient>;
  createStepTracker: CreateStepTracker;
  logLifecycle: LifecycleLogger;
  flowId: string;
  previousFees?: PreviousFees;
  setPreviousFees?: (previousFees: PreviousFees) => void;
  executeOnchainTx: (
    tx: ApiOnchainTxExecute,
  ) => Promise<ApiOnchainTxExecuteStatus>;
}): WalletExecutable => {
  const walletClientPromise = getWalletClient();
  const txContext = {
    flow_id: flowId,
    tx_chain: tx.chain,
    tx_type: tx.metadata.type,
    swap_source:
      tx.metadata.type === 'swap-v2' ? tx.metadata.quote.source : undefined,
  };

  const actionDataProvider = (() => {
    let requests: TransactionRequest[];

    async function getPreparedRequests() {
      siwfLog('getPreparedRequests ENTRY', {
        chain: tx.chain,
        actionsCount: tx.actions?.length,
        ts: Date.now(),
      });
      if (tx.chain === 'solana') {
        siwfLog('getPreparedRequests early-return (solana)', {
          ts: Date.now(),
        });
        return;
      }

      const prepareTracker = createStepTracker(
        'prepare_wallet_action',
        txContext,
      );

      try {
        prepareTracker.recordStep('get_wallet_client');

        const chain = apiChainToViemChainOrThrow(tx.chain);
        siwfLog('getPreparedRequests → awaiting walletClientPromise', {
          ts: Date.now(),
        });
        const walletClient = await walletClientPromise;
        siwfLog('getPreparedRequests ← walletClient resolved', {
          senderAddress: walletClient.account?.address,
          ts: Date.now(),
        });
        const senderAddress = walletClient.account?.address;

        if (!senderAddress) {
          throw new Error('Missing senderAddress');
        }

        prepareTracker.recordStep('get_common_data');
        siwfLog('getPreparedRequests → action.map: signTypedData per action', {
          actionsCount: tx.actions?.length,
          ts: Date.now(),
        });

        // This isn't very sophisticated.
        const noncePromise = withRetry(
          async () => {
            try {
              return await publicClient.getTransactionCount({
                address: senderAddress,
                blockTag: 'pending',
              });
            } catch (err) {
              prepareTracker.recordStepError(err, {
                viem_action: 'getTransactionCount',
              });
              throw err;
            }
          },
          {
            retryCount: RETRY_COUNT,
          },
        );

        const feesPromise = withRetry(
          async () => {
            try {
              return await publicClient.estimateFeesPerGas();
            } catch (err) {
              prepareTracker.recordStepError(err, {
                viem_action: 'estimateFeesPerGas',
              });
              throw err;
            }
          },
          {
            retryCount: RETRY_COUNT,
          },
        );

        const signaturesPromise = await Promise.all(
          tx.actions.map(async (action, idx) => {
            siwfLog('getPreparedRequests action', {
              idx,
              method: action.method,
              ts: Date.now(),
            });
            if (action.method === 'eth_signTypedData_v4') {
              return withRetry(
                async () => {
                  try {
                    siwfLog('signTypedData attempt', { idx, ts: Date.now() });
                    const sig = await walletClient.signTypedData(
                      action.params as SignTypedDataParameters,
                    );
                    siwfLog('signTypedData OK', {
                      idx,
                      sigPrefix:
                        typeof sig === 'string' ? sig.slice(0, 12) : undefined,
                      ts: Date.now(),
                    });
                    return sig;
                  } catch (err) {
                    siwfLog(
                      'signTypedData THREW (will retry up to RETRY_COUNT)',
                      {
                        idx,
                        errorName: (err as Error)?.name,
                        errorMessage: (err as Error)?.message,
                        ts: Date.now(),
                      },
                    );
                    prepareTracker.recordStepError(err, {
                      viem_action: 'signTypedData',
                    });

                    throw err;
                  }
                },
                { retryCount: RETRY_COUNT },
              );
            }

            return undefined;
          }),
        );

        const codePromise = withRetry(
          async () => {
            return await publicClient.getCode({
              address: walletClient.account?.address as Hex,
              blockTag: 'pending',
            });
          },
          { retryCount: RETRY_COUNT },
        );

        const [nonceResult, signaturesResult, feesResult, codeResult] =
          await Promise.all([
            noncePromise,
            signaturesPromise,
            feesPromise,
            codePromise,
          ]);

        let nonce = nonceResult;

        const delegationPrefixIdx = codeResult?.indexOf('0xef0100') ?? -1;
        const delegationImpl =
          codeResult && delegationPrefixIdx !== -1
            ? `0x${codeResult.slice(delegationPrefixIdx + 8, delegationPrefixIdx + 48)}`
            : undefined;
        siwfLog('getPreparedRequests codeResult (EIP-7702 check)', {
          senderAddress,
          codeResult,
          codeLen: codeResult?.length,
          isDelegated: !!delegationImpl,
          delegationImpl,
          isKnownDelegation:
            delegationImpl === '0xa845c74344fc9405b1fcf712f04668979573c1bf',
          ts: Date.now(),
        });

        const useCompactSignature = (() => {
          if (!codeResult) {
            return false;
          }

          const prefixIndex = codeResult.indexOf('0xef0100') ?? -1;
          if (prefixIndex === -1) {
            return false;
          }

          const authorizedImplementation = `0x${codeResult.slice(prefixIndex + 8, prefixIndex + 48)}`;

          return ['0xa845c74344fc9405b1fcf712f04668979573c1bf'].includes(
            authorizedImplementation,
          );
        })();
        siwfLog('getPreparedRequests useCompactSignature decision', {
          useCompactSignature,
          ts: Date.now(),
        });

        const sendTxReqs = tx.actions.reduce<TransactionRequest[]>(
          (txReqs, action, index) => {
            if (action.method !== 'eth_sendTransaction') {
              return txReqs;
            }

            let tag: Hex | undefined;

            const permitSignature = signaturesResult[index - 1];
            if (permitSignature) {
              let signature = permitSignature;
              if (useCompactSignature) {
                const parsedSignature = parseSignature(permitSignature);
                const parsedCompactSignature =
                  signatureToCompactSignature(parsedSignature);
                signature = serializeCompactSignature(parsedCompactSignature);
              }

              const length = numberToHex(size(signature), {
                signed: false,
                size: 32,
              });
              tag = concat([length, signature]);
            }

            return [
              ...txReqs,
              {
                type: 'eip1559',
                account: walletClient.account as JsonRpcAccount,
                to: action.params.to as Hex,
                nonce: nonce++,
                data: tag
                  ? concat([action.params.data as Hex, tag])
                  : (action.params.data as Hex),
                value: BigInt(action.params.value),
                chain,
                gas: action.params.gas ? BigInt(action.params.gas) : undefined,
                maxFeePerGas: feesResult.maxFeePerGas,
                maxPriorityFeePerGas: feesResult.maxPriorityFeePerGas,
              },
            ];
          },
          [] as TransactionRequest[],
        );

        if (!SKIP_SIMULATION_CHAINS.includes(tx.chain)) {
          try {
            prepareTracker.recordStep('simulate_calls');

            const simulationCalls = sendTxReqs.map(
              // Drop EIP-1559 fee parameters from simulation calls.
              (call) => ({
                ...call,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
                gas: undefined,
              }),
            );

            const simulation = await publicClient.simulateCalls({
              account: walletClient.account!,
              calls: simulationCalls,
            });

            for (const [index, result] of simulation.results.entries()) {
              if (result.error) {
                // Usually an RPC failure, so we'll just continue.
                if (result.error?.message?.includes('"<unknown>"')) {
                  continue;
                }
                throw result.error;
              }

              const bufferedEstimate =
                (result.gasUsed * BigInt(120)) / BigInt(100);

              if (
                !sendTxReqs[index].gas ||
                sendTxReqs[index].gas < bufferedEstimate
              ) {
                sendTxReqs[index].gas = bufferedEstimate;
              }
            }
          } catch (e) {
            if (e instanceof ContractFunctionExecutionError) {
              prepareTracker.recordStepError(e, {
                contractAddress: e.contractAddress,
                functionName: e.functionName,
                metaMessages: e.metaMessages,
              });
            }

            // Continue if eth_simulateV1 is not supported
            if (
              !(
                e instanceof MethodNotFoundRpcError ||
                e instanceof InternalRpcError
              )
            ) {
              throw e;
            }
          }
        }

        prepareTracker.stop();
        requests = sendTxReqs;
        return sendTxReqs;
      } catch (e) {
        prepareTracker.fail(e as Error);
        throw e;
      }
    }

    let pending = getPreparedRequests();

    const interval = setTimeout(() => {
      pending = getPreparedRequests();
    }, 500);

    return {
      getValue: async () => {
        if (requests) {
          return requests;
        }

        return pending;
      },
      stop: () => {
        clearInterval(interval);
      },
    };
  })();

  let executePromise: ReturnType<WalletExecutable['execute']>;
  const executeInner = async () => {
    const actionTracker = createStepTracker('exec_wallet_action', txContext);
    siwfLog('executeInner ENTRY (evm action)', {
      chain: tx.chain,
      txType: tx.metadata?.type,
      ts: Date.now(),
    });

    try {
      actionTracker.recordStep('prepare');
      siwfLog('executeInner → awaiting walletClient + actionData', {
        ts: Date.now(),
      });
      const [walletClient, ethSendTxs] = await Promise.all([
        walletClientPromise,
        actionDataProvider.getValue(),
      ]);
      siwfLog('executeInner ← walletClient + actionData resolved', {
        hasWalletClient: !!walletClient,
        walletAddress: walletClient?.account?.address,
        walletChainId: walletClient?.chain?.id,
        ethSendTxsCount: ethSendTxs?.length,
        ts: Date.now(),
      });

      if (ethSendTxs === undefined) {
        throw new Error('Unexpected undefined ethSendTxs');
      }

      actionTracker.recordStep('check_financial_impact');
      assertFinancialImpactAllowed(tx.metadata);

      actionTracker.recordStep('send_transactions');
      const sendPromises = Promise.all(
        ethSendTxs.map(async (request) => {
          const txTracker = createStepTracker('exec_eth_tx', txContext);

          try {
            if (!request.gas || SKIP_SIMULATION_CHAINS.includes(tx.chain)) {
              txTracker.recordStep('estimate_gas');
              request.gas = await (async () => {
                try {
                  const estimate = await withRetry(
                    async () => {
                      try {
                        return await publicClient.estimateGas(request);
                      } catch (err) {
                        txTracker.recordStepError(err, {
                          viem_action: 'estimateGas',
                        });
                        throw err;
                      }
                    },
                    {
                      retryCount: RETRY_COUNT,
                    },
                  );

                  const bufferedEstimate =
                    (estimate * BigInt(120)) / BigInt(100);
                  if (!request.gas || request.gas < bufferedEstimate) {
                    return bufferedEstimate;
                  }

                  return request.gas;
                } catch (error) {
                  txTracker.addContext({
                    default_gas_limit: true,
                  });

                  // Use a default gas limit
                  return 2_000_000n;
                }
              })();
            }

            if (request.maxFeePerGas && request.maxPriorityFeePerGas) {
              setPreviousFees?.({
                maxFeePerGas: request.maxFeePerGas.toString(),
                maxPriorityFeePerGas: request.maxPriorityFeePerGas.toString(),
              });
            }

            txTracker.recordStep('send_tx');
            siwfLog(
              'executeInner → walletClient.sendTransaction (with withRetry up to RETRY_COUNT=10)',
              {
                to: request.to,
                gas: request.gas?.toString(),
                ts: Date.now(),
              },
            );
            let sendTxAttempt = 0;
            const txHash = await withRetry(
              async () => {
                sendTxAttempt += 1;
                siwfLog('walletClient.sendTransaction attempt', {
                  attempt: sendTxAttempt,
                  ts: Date.now(),
                });
                try {
                  const hash = await walletClient.sendTransaction(request);
                  siwfLog('executeInner ← walletClient.sendTransaction OK', {
                    attempt: sendTxAttempt,
                    hash,
                    ts: Date.now(),
                  });
                  return hash;
                } catch (e) {
                  siwfLog('executeInner ← walletClient.sendTransaction THREW', {
                    attempt: sendTxAttempt,
                    errorName: (e as Error)?.name,
                    errorMessage: (e as Error)?.message,
                    ts: Date.now(),
                  });
                  if (
                    e instanceof TransactionExecutionError &&
                    e.details?.includes('replacement transaction underpriced')
                  ) {
                    const prevMaxFee = BigInt(
                      previousFees?.maxFeePerGas ?? '0',
                    );
                    const prevMaxPriorityFee = BigInt(
                      previousFees?.maxPriorityFeePerGas ?? '0',
                    );
                    const currMaxFee = BigInt(request.maxFeePerGas ?? '0');
                    const currMaxPriorityFee = BigInt(
                      request.maxPriorityFeePerGas ?? '0',
                    );

                    const nextMaxFee =
                      prevMaxFee > currMaxFee ? prevMaxFee : currMaxFee;
                    const nextMaxPriorityFee =
                      prevMaxPriorityFee > currMaxPriorityFee
                        ? prevMaxPriorityFee
                        : currMaxPriorityFee;

                    const bufferedNextMaxFee =
                      (nextMaxFee * BigInt(120)) / BigInt(100);
                    const bufferedNextMaxPriorityFee =
                      (nextMaxPriorityFee * BigInt(120)) / BigInt(100);
                    request.maxFeePerGas = bufferedNextMaxFee;
                    request.maxPriorityFeePerGas = bufferedNextMaxPriorityFee;

                    return await walletClient.sendTransaction(request);
                  }
                  txTracker.recordStepError(e, {
                    viem_action: 'sendTransaction',
                  });
                  throw e;
                }
              },
              { retryCount: RETRY_COUNT },
            );

            txTracker.recordStep('on_processed');
            await tx.onProcessed?.(txHash);

            txTracker.recordStep('wait_for_tx_receipt');
            const receipt = await withRetry(
              async () => {
                try {
                  return await publicClient.waitForTransactionReceipt({
                    hash: txHash as `0x${string} `,
                    timeout: getWaitForTransactionReceiptTimeoutForChain(
                      tx.chain,
                    ),
                  });
                } catch (e) {
                  txTracker.recordStepError(e, {
                    viem_action: 'waitForTransactionReceipt',
                  });
                  throw e;
                }
              },
              {
                shouldRetry: ({ count, error }) => {
                  const err = error as WaitForTransactionReceiptErrorType;
                  if (err.name === 'WaitForTransactionReceiptTimeoutError') {
                    return count < 2;
                  }

                  return count < RETRY_COUNT;
                },
              },
            );

            txTracker.stop({
              tx_result: receipt.status,
            });

            return {
              txHash,
              result:
                receipt.status === 'success'
                  ? ('confirmed' as const)
                  : ('reverted' as const),
            };
          } catch (e) {
            txTracker.fail(e as Error, {
              tx_result: 'error',
              tx_error_name: (e as Error).name,
              tx_error_msg: (e as Error).message,
            });

            throw e;
          }
        }),
      );

      const sendResults = await sendPromises;

      const txHash = sendResults[sendResults.length - 1].txHash;
      const result = sendResults[sendResults.length - 1].result;

      actionTracker.stop({
        result,
      });

      return { result, txHash };
    } catch (error) {
      await tx.onError?.(error as Error);
      actionTracker.fail(error as Error);
      throw error;
    }
  };

  return {
    flowId,
    destroy: () => {
      logLifecycle('prepare_abandoned', { ...txContext });
      actionDataProvider.stop();
    },
    execute: () => {
      logLifecycle('execute_called', {
        ...txContext,
        reused_promise: !!executePromise,
      });
      // Defense if depth protection that we don't accidentally double execute
      // a transaction.
      if (!executePromise) {
        executePromise = executeInner();
      }

      return executePromise;
    },
  };
};

const buildSolanaExecutable = ({
  tx,
  solanaWalletProvider,
  createStepTracker,
  executeOnchainTx,
  logLifecycle,
  flowId,
}: {
  tx: ActionsTransactionOptions;
  solanaWalletProvider: SolanaWalletProviderWithConn;
  createStepTracker: CreateStepTracker;
  logLifecycle: LifecycleLogger;
  flowId: string;
  executeOnchainTx: (
    tx: ApiOnchainTxExecute,
  ) => Promise<ApiOnchainTxExecuteStatus>;
}): WalletExecutable => {
  const txContext = {
    flow_id: flowId,
    tx_chain: tx.chain,
    tx_type: tx.metadata.type,
    swap_source:
      tx.metadata.type === 'swap-v2' ? tx.metadata.quote.source : undefined,
  };

  let executePromise: ReturnType<WalletExecutable['execute']>;
  const executeInner = async () => {
    let txHash: string | undefined;
    let signedTransaction: string | undefined;
    let result: 'reverted' | 'confirmed' | 'processing' = 'processing';

    const actionTracker = createStepTracker('exec_solana_action', txContext);

    try {
      actionTracker.recordStep('process_actions');
      for (const action of tx.actions) {
        switch (action.method) {
          case 'sol_signAndSendTransaction': {
            for (const transaction of action.params.transactions) {
              const deserializedTransaction = VersionedTransaction.deserialize(
                new Uint8Array(Buffer.from(transaction, 'base64')),
              );

              try {
                const simulation = await solanaConnection.simulateTransaction(
                  deserializedTransaction,
                );

                if (simulation.value.err) {
                  let message = '';
                  try {
                    if (typeof simulation.value.err === 'string') {
                      message = simulation.value.err;
                    } else {
                      message = JSON.stringify(simulation.value.err);
                    }
                  } catch {
                    message = 'Unknown error';
                  }

                  throw new SimulationError(message);
                }
              } catch (e) {
                const message =
                  e instanceof Error ? e.message : 'Unknown error';
                throw new SimulationError(message);
              }

              const txResult =
                await solanaWalletProvider.signAndSendTransaction({
                  transaction: deserializedTransaction,
                  connection: solanaConnection,
                });
              txHash = txResult.signature;

              const processed = await waitForSolanaTransaction({
                signature: txHash,
                waitingFor: 'processed',
              });

              if (processed.status === 'reverted') {
                result = 'reverted';
              } else if (
                processed.status === 'confirmed' ||
                processed.status === 'finalized'
              ) {
                await tx.onProcessed?.(txHash);
                result = 'confirmed';
              } else if (processed.status === 'processed') {
                await tx.onProcessed?.(txHash);
                const confirmation = await waitForSolanaTransaction({
                  signature: txHash,
                  waitingFor: 'confirmed',
                });
                if (confirmation.status === 'reverted') {
                  result = 'reverted';
                } else if (
                  confirmation.status === 'confirmed' ||
                  confirmation.status === 'finalized'
                ) {
                  result = 'confirmed';
                }
              }
            }
            break;
          }
          case 'sol_signTransaction': {
            const deserializedTransaction = VersionedTransaction.deserialize(
              new Uint8Array(Buffer.from(action.params.transaction, 'base64')),
            );
            const transaction = await solanaWalletProvider.signTransaction(
              deserializedTransaction,
            );
            signedTransaction = Buffer.from(
              transaction.signedTransaction.serialize(),
            ).toString('base64');
            break;
          }
          case 'sol_executeTransaction': {
            if (!signedTransaction) {
              throw new TransactionError('No signed transaction');
            }
            const response = await executeOnchainTx({
              ...(action.params as ApiOnchainTxExecuteSwapJupiterUltra),
              transaction: signedTransaction,
            });
            if (response.status === 'error') {
              throw new TransactionError(response.error ?? 'Unknown error');
            } else if (response.status === 'reverted') {
              result = 'reverted';
              txHash = response.txHash;
              tx.onProcessed?.(txHash);
            } else if (response.status === 'confirmed') {
              result = 'confirmed';
              txHash = response.txHash;
              tx.onProcessed?.(txHash);
            }
            break;
          }
          default: {
            throw new Error(`Unknown action method: ${action.method}`);
          }
        }
      }

      if (!txHash) {
        throw new TransactionError('No transaction hash');
      }

      if (result === 'processing') {
        throw new TransactionError('Transaction stuck in processing');
      }

      actionTracker.stop({
        result,
      });

      return { result, txHash };
    } catch (error) {
      await tx.onError?.(error as Error, txHash);
      actionTracker.fail(error as Error);
      throw error;
    }
  };

  return {
    flowId,
    destroy: () => {
      logLifecycle('prepare_abandoned', { ...txContext });
    },
    execute: () => {
      logLifecycle('execute_called', {
        ...txContext,
        reused_promise: !!executePromise,
      });
      // Defense if depth protection that we don't accidentally double execute
      // a transaction.
      if (!executePromise) {
        executePromise = executeInner();
      }

      return executePromise;
    },
  };
};

export type ActionsTransactionOptions = BaseTransactionOptions & {
  protocol: 'actions';
  actions: ApiFarcasterWalletAction[];
  beforeExecute?: () => Promise<void>;
  executable?: WalletExecutable;
};

export type ExecutableActionsTransactionOptions = ActionsTransactionOptions & {
  executable: WalletExecutable;
};

/**
 * It's critical that either abandon or submit is called on an
 * PreparedWalletAction. Otherwise memory leaks and rate limiting will ensue.
 */
export type PreparedWalletAction = {
  submit: () => { id: string };
  abandon: () => void;
  executable: WalletExecutable;
};

export type SubmitTransactionOptions =
  | EvmTransactionOptions
  | EvmGaslessTransactionOptions
  | SolanaTransactionOptions
  | ActionsTransactionOptions;

type SolanaWalletTransaction = SolanaTransactionOptions & {
  id: string;
  timestamp: number;
  status: TransactionStatus;
  txHash?: string;
};

type EvmWalletTransaction = EvmTransactionOptions & {
  id: string;
  timestamp: number;
  status: TransactionStatus;
  txHash?: string;
};

type EvmGaslessWalletTransaction = EvmGaslessTransactionOptions & {
  id: string;
  timestamp: number;
  status: TransactionStatus;
  txHash?: string;
};

type ActionsWalletTransaction = ActionsTransactionOptions & {
  id: string;
  timestamp: number;
  status: TransactionStatus;
  txHash?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
};

export type WalletTransaction =
  | SolanaWalletTransaction
  | EvmWalletTransaction
  | EvmGaslessWalletTransaction
  | ActionsWalletTransaction;

interface WalletTransactionsContextType {
  walletTransactions: WalletTransaction[];
  prepareAction: (tx: ActionsTransactionOptions) => PreparedWalletAction;
  submitTransaction: (tx: SubmitTransactionOptions) => {
    id: string;
    deduped?: boolean;
  };
  submitTransactionAsync: (tx: SubmitTransactionOptions) => Promise<void>;
}

const WalletTransactionsContext = createContext<
  WalletTransactionsContextType | undefined
>(undefined);

interface WalletTransactionsProviderProps {
  children: ReactNode;
}

const WALLET_TXS_CACHE_KEY = ['wallet-transactions'];
const PREVIOUS_FEES_CACHE_KEY = ['previous-fees'];

const generateTransactionId = (
  tx: SubmitTransactionOptions,
  timestamp: number,
) => {
  return JSON.stringify({ ...tx, timestamp })
    .split('')
    .reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0)
    .toString(36);
};

const getBidTransactionDedupKey = (
  tx: Pick<WalletTransaction, 'chain' | 'metadata'>,
) => {
  if (tx.metadata?.type !== 'bid') {
    return undefined;
  }

  return [
    tx.chain,
    tx.metadata.cast.hash,
    tx.metadata.bid.bidder.fid,
    tx.metadata.bid.amount,
  ].join(':');
};

const findRecentDuplicateBidTransaction = (
  transactions: WalletTransaction[],
  tx: SubmitTransactionOptions,
  now: number,
) => {
  const dedupKey = getBidTransactionDedupKey(tx);
  if (!dedupKey) {
    return undefined;
  }

  for (let i = transactions.length - 1; i >= 0; i--) {
    const transaction = transactions[i];

    if (
      transaction.status !== 'pending' &&
      transaction.status !== 'processing'
    ) {
      continue;
    }

    if (now - transaction.timestamp > 2 * 60 * 1000) {
      continue;
    }

    if (getBidTransactionDedupKey(transaction) === dedupKey) {
      return transaction;
    }
  }

  return undefined;
};

export const WalletTransactionsProvider: React.FC<
  WalletTransactionsProviderProps
> = ({ children }) => {
  const { solanaWalletProvider, getWalletClient } = useEmbeddedWallet();
  const { getEthereumClient } = usePublicClient();
  const queryClient = useQueryClient();
  const toast = useRootToast();
  const { apiClient } = useFarcasterApiClient();
  const { triggerSuccessNotificationAsync } = useHaptics();
  const { onSuccess: onSwapStatusSuccess } = useSharedWalletSwapStatusContext();

  const { data = [] } = useQuery<WalletTransaction[]>({
    queryKey: WALLET_TXS_CACHE_KEY,
    initialData: [],
  });
  const processingTransactionIdsRef = useRef(new Set<string>());

  const { addRumAction } = useSharedTelemetry();
  const logLifecycle = useCallback<LifecycleLogger>(
    (phase, context = {}) => {
      addRumAction('wallet_tx_lifecycle', { phase, ...context });
    },
    [addRumAction],
  );

  const processSolanaTransaction = useCallback(
    async (tx: SolanaWalletTransaction) => {
      try {
        const transaction = await tx.buildTransaction();

        const { signature } = await solanaWalletProvider.signAndSendTransaction(
          {
            transaction,
            connection: solanaConnection,
          },
        );

        queryClient.setQueryData<WalletTransaction[]>(
          WALLET_TXS_CACHE_KEY,
          (old = []) =>
            old.map((t) =>
              t.id === tx.id
                ? {
                    ...t,
                    status: 'processing',
                    txHash: signature,
                  }
                : t,
            ),
        );

        const handleRevert = () => {
          queryClient.setQueryData<WalletTransaction[]>(
            WALLET_TXS_CACHE_KEY,
            (old = []) =>
              old.map((t) =>
                t.id === tx.id ? { ...t, status: 'reverted' } : t,
              ),
          );

          tx.onError?.(undefined, signature);
        };

        const handleProcessed = () => {
          tx.onProcessed?.(signature);
        };

        const handleSuccess = () => {
          queryClient.setQueryData<WalletTransaction[]>(
            WALLET_TXS_CACHE_KEY,
            (old = []) =>
              old.map((t) =>
                t.id === tx.id ? { ...t, status: 'confirmed' } : t,
              ),
          );

          tx.onSuccess?.(signature, tx.id);

          if (!tx.disableHaptics) {
            triggerSuccessNotificationAsync();
          }

          onSwapStatusSuccess();
        };

        const processed = await waitForSolanaTransaction({
          signature,
          waitingFor: 'processed',
        });

        if (processed.status === 'reverted') {
          handleRevert();
        } else if (
          processed.status === 'confirmed' ||
          processed.status === 'finalized'
        ) {
          handleProcessed();
          handleSuccess();
        } else if (processed.status === 'processed') {
          handleProcessed();
          const confirmation = await waitForSolanaTransaction({
            signature,
            waitingFor: 'confirmed',
          });
          if (confirmation.status === 'reverted') {
            handleRevert();
          } else if (
            confirmation.status === 'confirmed' ||
            confirmation.status === 'finalized'
          ) {
            handleSuccess();
          }
        }
      } catch (error) {
        queryClient.setQueryData<WalletTransaction[]>(
          WALLET_TXS_CACHE_KEY,
          (old = []) =>
            old.map((t) => (t.id === tx.id ? { ...t, status: 'reverted' } : t)),
        );
        tx.onError?.(error as Error);
      } finally {
        setTimeout(() => {
          toast.hide(tx.id);
        }, 3000);
      }
    },
    [
      onSwapStatusSuccess,
      queryClient,
      solanaWalletProvider,
      toast,
      triggerSuccessNotificationAsync,
    ],
  );

  const processEvmTransaction = useCallback(
    async (tx: EvmWalletTransaction) => {
      try {
        const chain = apiChainToViemChainOrThrow(tx.chain);
        const walletClient = await getWalletClient(chain);
        const publicClient = getEthereumClient({
          chain,
        });

        const transaction = await tx.buildTransaction();

        try {
          const estimate = await publicClient.estimateGas({
            account: walletClient.account,
            to: transaction.to,
            data: transaction.data,
            value: transaction.value,
          });
          const bufferedEstimate = (estimate * BigInt(120)) / BigInt(100);
          if (!transaction.gas || transaction.gas < bufferedEstimate) {
            transaction.gas = bufferedEstimate;
          }
        } catch (error) {
          // Do nothing
        }

        // Use default gas limit
        if (!transaction.gas) {
          transaction.gas = 2_000_000n;
        }

        let txHash: Hex;
        try {
          txHash = await walletClient.sendTransaction(transaction);
        } catch (error) {
          const rawTransaction =
            extractRawTransactionFromAlreadyKnownError(error);
          if (!rawTransaction) {
            throw error;
          }

          txHash = keccak256(rawTransaction);
          logLifecycle('send_already_known', {
            tx_id: tx.id,
            tx_chain: tx.chain,
            tx_type: tx.metadata.type,
          });
        }

        queryClient.setQueryData<WalletTransaction[]>(
          WALLET_TXS_CACHE_KEY,
          (old = []) =>
            old.map((t) =>
              t.id === tx.id
                ? {
                    ...t,
                    status: 'processing',
                    txHash,
                  }
                : t,
            ),
        );

        const handleRevert = async () => {
          queryClient.setQueryData<WalletTransaction[]>(
            WALLET_TXS_CACHE_KEY,
            (old = []) =>
              old.map((t) =>
                t.id === tx.id ? { ...t, status: 'reverted' } : t,
              ),
          );
          try {
            await tx.onError?.(undefined, txHash);
          } catch (callbackError) {
            logLifecycle('callback_error', {
              tx_id: tx.id,
              callback: 'onError',
              error_name: (callbackError as Error)?.name,
            });
          }
        };

        const handleProcessed = async () => {
          try {
            await tx.onProcessed?.(txHash);
          } catch (callbackError) {
            logLifecycle('callback_error', {
              tx_id: tx.id,
              callback: 'onProcessed',
              error_name: (callbackError as Error)?.name,
            });
          }
        };

        const handleSuccess = async () => {
          queryClient.setQueryData<WalletTransaction[]>(
            WALLET_TXS_CACHE_KEY,
            (old = []) =>
              old.map((t) =>
                t.id === tx.id ? { ...t, status: 'confirmed' } : t,
              ),
          );
          try {
            await tx.onSuccess?.(txHash, tx.id);
          } catch (callbackError) {
            logLifecycle('callback_error', {
              tx_id: tx.id,
              callback: 'onSuccess',
              error_name: (callbackError as Error)?.name,
            });
          }
          try {
            if (!tx.disableHaptics) {
              await triggerSuccessNotificationAsync();
            }
          } catch (callbackError) {
            logLifecycle('callback_error', {
              tx_id: tx.id,
              callback: 'triggerSuccessNotificationAsync',
              error_name: (callbackError as Error)?.name,
            });
          }
        };

        void handleProcessed();

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        if (receipt.status === 'success') {
          await handleSuccess();
        } else {
          await handleRevert();
        }
      } catch (error) {
        queryClient.setQueryData<WalletTransaction[]>(
          WALLET_TXS_CACHE_KEY,
          (old = []) =>
            old.map((t) => (t.id === tx.id ? { ...t, status: 'reverted' } : t)),
        );
        tx.onError?.(error as Error);
      } finally {
        setTimeout(() => {
          toast.hide(tx.id);
        }, 3000);
      }
    },
    [
      getEthereumClient,
      getWalletClient,
      logLifecycle,
      queryClient,
      toast,
      triggerSuccessNotificationAsync,
    ],
  );

  const processEvmGaslessTransaction = useCallback(
    async (tx: EvmGaslessWalletTransaction) => {
      try {
        const chain = apiChainToViemChainOrThrow(tx.chain);
        const walletClient = await getWalletClient(chain);

        const quote = await tx.buildTransaction();

        let requestId = quote.requestId;
        if (requestId === undefined) {
          requestId = await executeQuoteAsync({
            quote: quote.quote,
            chainId: quote.quote.price.sell.token.chainId!,
            apiClient,
            client: walletClient as WalletClient,
            applicationUsage: 'other',
          });
        }

        if (!requestId) {
          throw new Error('Failed to execute quote');
        }

        queryClient.setQueryData<WalletTransaction[]>(
          WALLET_TXS_CACHE_KEY,
          (old = []) =>
            old.map((t) =>
              t.id === tx.id
                ? {
                    ...t,
                    status: 'processing',
                    txHash: requestId,
                  }
                : t,
            ),
        );

        const handleProcessed = () => {
          tx.onProcessed?.(requestId);
        };

        handleProcessed();

        const { status, transactionHash } = await waitForQuoteToComplete({
          requestId,
          chainId: quote.quote.price.sell.token.chainId!,
          apiClient,
          setTxHash: (txHash) => {
            queryClient.setQueryData<WalletTransaction[]>(
              WALLET_TXS_CACHE_KEY,
              (old = []) =>
                old.map((t) => (t.id === tx.id ? { ...t, txHash } : t)),
            );
          },
        });

        const handleRevert = () => {
          queryClient.setQueryData<WalletTransaction[]>(
            WALLET_TXS_CACHE_KEY,
            (old = []) =>
              old.map((t) =>
                t.id === tx.id ? { ...t, status: 'reverted' } : t,
              ),
          );
          tx.onError?.(undefined, transactionHash);
        };

        if (status !== 'confirmed' || !transactionHash) {
          handleRevert();
          return;
        }

        const handleSuccess = () => {
          queryClient.setQueryData<WalletTransaction[]>(
            WALLET_TXS_CACHE_KEY,
            (old = []) =>
              old.map((t) =>
                t.id === tx.id ? { ...t, status: 'confirmed' } : t,
              ),
          );
          tx.onSuccess?.(transactionHash, tx.id);
          if (!tx.disableHaptics) {
            triggerSuccessNotificationAsync();
          }
        };

        handleSuccess();
      } catch (error) {
        queryClient.setQueryData<WalletTransaction[]>(
          WALLET_TXS_CACHE_KEY,
          (old = []) =>
            old.map((t) => (t.id === tx.id ? { ...t, status: 'reverted' } : t)),
        );
        tx.onError?.(error as Error);
      } finally {
        setTimeout(() => {
          toast.hide(tx.id);
        }, 3000);
      }
    },
    [
      getWalletClient,
      queryClient,
      toast,
      apiClient,
      triggerSuccessNotificationAsync,
    ],
  );

  const createStepTracker = useStepTracker();
  const processActions = useCallback(
    async (tx: ActionsWalletTransaction) => {
      siwfLog('processActions ENTRY', {
        id: tx.id,
        chain: tx.chain,
        actionsCount: tx.actions?.length,
        hasBeforeExecute: !!tx.beforeExecute,
        hasOnExecute: !!tx.onExecute,
        hasOnSuccess: !!tx.onSuccess,
        hasOnError: !!tx.onError,
        hasExecutable: !!tx.executable,
        ts: Date.now(),
      });

      logLifecycle('process_start', {
        tx_id: tx.id,
        flow_id: tx.executable?.flowId,
        has_executable: !!tx.executable,
        tx_chain: tx.chain,
        tx_type: tx.metadata?.type,
        actions_count: tx.actions?.length,
      });

      queryClient.setQueryData<WalletTransaction[]>(
        WALLET_TXS_CACHE_KEY,
        (old = []) =>
          old.map((t) =>
            t.id === tx.id
              ? {
                  ...t,
                  status: 'processing',
                }
              : t,
          ),
      );

      if (tx.beforeExecute) {
        siwfLog('processActions → beforeExecute()', { ts: Date.now() });
        await tx.beforeExecute();
        siwfLog('processActions ← beforeExecute() done', { ts: Date.now() });
      }

      if (tx.onExecute) {
        siwfLog('processActions → onExecute()', { ts: Date.now() });
        await tx.onExecute();
        siwfLog('processActions ← onExecute() done', { ts: Date.now() });
      }

      const chain = apiChainToViemChainOrThrow(tx.chain);
      const publicClient = getEthereumClient({
        chain,
      });

      const previousFees = queryClient.getQueryData<PreviousFees>(
        PREVIOUS_FEES_CACHE_KEY,
      );

      const setPreviousFees = (previousFees: PreviousFees) => {
        queryClient.setQueryData<PreviousFees>(
          PREVIOUS_FEES_CACHE_KEY,
          previousFees,
        );
      };

      const executeOnchainTx = async (tx: ApiOnchainTxExecute) => {
        const response = await apiClient.executeOnchainTx(tx);
        return response.data.result;
      };

      const execution =
        tx.executable ??
        buildWalletExecutable({
          publicClient: publicClient as PublicClient,
          getWalletClient: () =>
            getWalletClient(chain) as Promise<WalletClient>,
          solanaWalletProvider,
          createStepTracker,
          logLifecycle,
          tx,
          previousFees,
          setPreviousFees,
          executeOnchainTx,
        });

      // Guard so a throw in a post-result callback (onSuccess/onError/haptics)
      // doesn't emit a second, conflicting process_result for the same flow_id.
      let resultLogged = false;
      try {
        siwfLog('processActions → execution.execute()', { ts: Date.now() });
        const { result, txHash } = await execution.execute();
        siwfLog('processActions ← execution.execute() resolved', {
          result,
          txHash,
          ts: Date.now(),
        });

        logLifecycle('process_result', {
          tx_id: tx.id,
          flow_id: execution.flowId,
          result,
          has_tx_hash: !!txHash,
        });
        resultLogged = true;

        if (result === 'reverted') {
          siwfLog('processActions → tx.onError(undefined, txHash) [reverted]', {
            txHash,
            ts: Date.now(),
          });
          await tx.onError?.(undefined, txHash);
        } else {
          siwfLog('processActions → tx.onSuccess(txHash)', {
            txHash,
            ts: Date.now(),
          });
          await tx.onSuccess?.(txHash, tx.id);
        }

        queryClient.setQueryData<WalletTransaction[]>(
          WALLET_TXS_CACHE_KEY,
          (old = []) =>
            old.map((t) =>
              t.id === tx.id ? { ...t, status: result, txHash } : t,
            ),
        );

        if (!tx.disableHaptics) {
          triggerSuccessNotificationAsync();
        }
      } catch (error) {
        siwfLog('processActions CAUGHT throw → forwarding to tx.onError', {
          errorName: (error as Error)?.name,
          errorMessage: (error as Error)?.message,
          errorStackHead: (error as Error)?.stack
            ?.split('\n')
            .slice(0, 5)
            .join('\n'),
          ts: Date.now(),
        });
        if (!resultLogged) {
          logLifecycle('process_result', {
            tx_id: tx.id,
            flow_id: execution.flowId,
            result: 'error',
            error_name: (error as Error)?.name,
          });
        }
        await tx.onError?.(error as Error);
        queryClient.setQueryData<WalletTransaction[]>(
          WALLET_TXS_CACHE_KEY,
          (old = []) =>
            old.map((t) => (t.id === tx.id ? { ...t, status: 'reverted' } : t)),
        );
      } finally {
        setTimeout(() => {
          toast.hide(tx.id);
        }, 3000);
      }
    },
    [
      queryClient,
      getWalletClient,
      getEthereumClient,
      solanaWalletProvider,
      createStepTracker,
      logLifecycle,
      triggerSuccessNotificationAsync,
      toast,
      apiClient,
    ],
  );

  useEffect(() => {
    if (data.length > 0) {
      siwfLog('queue effect tick', {
        len: data.length,
        items: data.map((t) => ({
          id: t.id,
          status: t.status,
          protocol: 'protocol' in t ? t.protocol : undefined,
          ageMs: Date.now() - t.timestamp,
        })),
        ts: Date.now(),
      });
    }
    for (const tx of data) {
      if (tx.status !== 'pending') {
        // Remove stuck transactions that are older than 2 minutes
        if (
          tx.status === 'processing' &&
          tx.timestamp < Date.now() - 1 * 60 * 1000
        ) {
          siwfLog('queue effect: dropping stuck processing tx (>1min)', {
            id: tx.id,
            ageMs: Date.now() - tx.timestamp,
            ts: Date.now(),
          });
          logLifecycle('stuck_dropped', {
            tx_id: tx.id,
            flow_id: 'executable' in tx ? tx.executable?.flowId : undefined,
            age_ms: Date.now() - tx.timestamp,
            status: tx.status,
            protocol: 'protocol' in tx ? tx.protocol : undefined,
          });
          queryClient.setQueryData<WalletTransaction[]>(
            WALLET_TXS_CACHE_KEY,
            (old = []) => old.filter((t) => t.id !== tx.id),
          );
        }
        continue;
      }

      if (processingTransactionIdsRef.current.has(tx.id)) {
        siwfLog('queue effect: tx already processing, skipping dispatch', {
          id: tx.id,
          ts: Date.now(),
        });
        logLifecycle('queue_dispatch_skipped', {
          tx_id: tx.id,
          flow_id: 'executable' in tx ? tx.executable?.flowId : undefined,
          protocol: 'protocol' in tx ? tx.protocol : undefined,
          age_ms: Date.now() - tx.timestamp,
        });
        continue;
      }
      processingTransactionIdsRef.current.add(tx.id);

      queryClient.setQueryData<WalletTransaction[]>(
        WALLET_TXS_CACHE_KEY,
        (old = []) =>
          old.map((t) =>
            t.id === tx.id
              ? {
                  ...t,
                  status: 'processing',
                }
              : t,
          ),
      );

      siwfLog('queue effect → dispatch processor', {
        id: tx.id,
        protocol: 'protocol' in tx ? tx.protocol : undefined,
        ts: Date.now(),
      });
      logLifecycle('queue_dispatch', {
        tx_id: tx.id,
        flow_id: 'executable' in tx ? tx.executable?.flowId : undefined,
        protocol: 'protocol' in tx ? tx.protocol : undefined,
        age_ms: Date.now() - tx.timestamp,
      });
      const processor = (() => {
        switch (tx.protocol) {
          case 'solana':
            return processSolanaTransaction(tx);
          case 'ethereum':
            return processEvmTransaction(tx);
          case 'ethereum-gasless':
            return processEvmGaslessTransaction(tx);
          case 'actions':
            return processActions(tx);
        }
      })();

      processor?.finally(() => {
        processingTransactionIdsRef.current.delete(tx.id);
      });
    }
  }, [
    data,
    queryClient,
    logLifecycle,
    processSolanaTransaction,
    processEvmTransaction,
    processEvmGaslessTransaction,
    processActions,
  ]);

  const submitTransaction = useCallback(
    (tx: SubmitTransactionOptions): { id: string; deduped?: boolean } => {
      const timestamp = Date.now();
      const duplicate = findRecentDuplicateBidTransaction(
        queryClient.getQueryData<WalletTransaction[]>(WALLET_TXS_CACHE_KEY) ??
          [],
        tx,
        timestamp,
      );

      if (duplicate) {
        siwfLog('submitTransaction: deduped active bid transaction', {
          id: duplicate.id,
          status: duplicate.status,
          ts: timestamp,
        });
        return { id: duplicate.id, deduped: true };
      }

      const id = generateTransactionId(tx, timestamp);

      siwfLog('submitTransaction', {
        id,
        chain: tx.chain,
        metadataType: tx.metadata?.type,
        protocol: 'protocol' in tx ? tx.protocol : undefined,
        ts: timestamp,
      });

      const flowId = 'executable' in tx ? tx.executable?.flowId : undefined;
      logLifecycle('submit', {
        tx_id: id,
        flow_id: flowId,
        has_executable: !!flowId,
        tx_chain: tx.chain,
        tx_type: tx.metadata?.type,
        protocol: 'protocol' in tx ? tx.protocol : undefined,
      });

      queryClient.setQueryData<WalletTransaction[]>(
        WALLET_TXS_CACHE_KEY,
        (old = []) => [...old, { ...tx, id, status: 'pending', timestamp }],
      );

      const showToast = tx.toast === undefined ? true : tx.toast;
      if (showToast) {
        toast.show(id, {
          type: 'transaction',
          id,
          duration: 60_000,
          placement: 'top',
          data: {
            chain: tx.chain,
            metadata: tx.metadata,
          },
        });
      }

      return { id };
    },
    [queryClient, toast, logLifecycle],
  );

  const submitTransactionAsync = useCallback(
    (tx: SubmitTransactionOptions): Promise<void> => {
      return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const duplicate = findRecentDuplicateBidTransaction(
          queryClient.getQueryData<WalletTransaction[]>(WALLET_TXS_CACHE_KEY) ??
            [],
          tx,
          timestamp,
        );

        if (duplicate) {
          const cleanupDuplicateWait = () => {
            clearInterval(checkExistingInterval);
            clearTimeout(timeout);
          };

          const checkExistingInterval = setInterval(() => {
            const data =
              queryClient.getQueryData<WalletTransaction[]>(
                WALLET_TXS_CACHE_KEY,
              );
            const transaction = data?.find((t) => t.id === duplicate.id);

            if (
              transaction?.status === 'confirmed' ||
              transaction?.status === 'reverted'
            ) {
              cleanupDuplicateWait();
              resolve();
            }
          }, 100);

          const timeout = setTimeout(() => {
            cleanupDuplicateWait();
            reject(new Error('Transaction timeout'));
          }, 120_000);

          return;
        }

        const id = generateTransactionId(tx, timestamp);
        queryClient.setQueryData<WalletTransaction[]>(
          WALLET_TXS_CACHE_KEY,
          (old = []) => [...old, { ...tx, id, status: 'pending', timestamp }],
        );

        const checkInterval = setInterval(() => {
          const data =
            queryClient.getQueryData<WalletTransaction[]>(WALLET_TXS_CACHE_KEY);
          const transaction = data?.find((t) => t.id === id);

          if (transaction?.status === 'confirmed') {
            clearInterval(checkInterval);
            resolve();
          } else if (transaction?.status === 'reverted') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 200);

        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Transaction timeout'));
        }, 120_000);

        return { id };
      });
    },
    [queryClient],
  );

  const prepareAction = useCallback(
    (tx: ActionsTransactionOptions) => {
      const chain = apiChainToViemChainOrThrow(tx.chain);
      const publicClient = getEthereumClient({
        chain,
      });

      const previousFees = queryClient.getQueryData<PreviousFees>(
        PREVIOUS_FEES_CACHE_KEY,
      );

      const setPreviousFees = (previousFees: PreviousFees) => {
        queryClient.setQueryData<PreviousFees>(
          PREVIOUS_FEES_CACHE_KEY,
          previousFees,
        );
      };

      const executeOnchainTx = async (tx: ApiOnchainTxExecute) => {
        const response = await apiClient.executeOnchainTx(tx);
        return response.data.result;
      };

      const executable = buildWalletExecutable({
        publicClient: publicClient as PublicClient,
        getWalletClient: () => getWalletClient(chain) as Promise<WalletClient>,
        solanaWalletProvider,
        createStepTracker,
        logLifecycle,
        tx,
        previousFees,
        setPreviousFees,
        executeOnchainTx,
      });

      return {
        submit: () => submitTransaction({ ...tx, executable }),
        abandon: () => {
          executable.destroy();
        },
        executable,
      };
    },
    [
      queryClient,
      createStepTracker,
      getEthereumClient,
      getWalletClient,
      solanaWalletProvider,
      submitTransaction,
      logLifecycle,
      apiClient,
    ],
  );

  const contextValue = useMemo(
    () => ({
      walletTransactions: data,
      prepareAction,
      submitTransaction,
      submitTransactionAsync,
    }),
    [data, prepareAction, submitTransaction, submitTransactionAsync],
  );

  return (
    <WalletTransactionsContext.Provider value={contextValue}>
      {children}
    </WalletTransactionsContext.Provider>
  );
};

export const useWalletTransactions = () => {
  const context = useContext(WalletTransactionsContext);
  if (context === undefined) {
    throw new Error(
      'useWalletTransactions must be used within a WalletTransactionsProvider',
    );
  }
  return context;
};

export const useWalletTransaction = (id: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['transaction-status', id],
    queryFn: () => {
      const data =
        queryClient.getQueryData<WalletTransaction[]>(WALLET_TXS_CACHE_KEY);

      return data?.find((tx) => tx.id === id);
    },
    refetchInterval: 200,
  });
};
