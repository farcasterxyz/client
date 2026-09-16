import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  ApiChainId,
  apiChainToViemChainOrThrow,
  ApiEthFungibleTokenPosition,
  ApiPlatformType,
  ApiSwapQuote,
  chainIdToChainOrThrow,
  ETHER_DECIMALS,
} from 'farcaster-client-data';
import {
  tokenAnalyticsName,
  tokenQuantityToUsdFloat,
} from 'farcaster-client-hooks';
import { useCallback, useRef, useState } from 'react';
import {
  concat,
  erc20Abi,
  formatUnits,
  getContract,
  Hex,
  InternalRpcError,
  maxUint256,
  MethodNotFoundRpcError,
  numberToHex,
  SignTypedDataParameters,
  size,
} from 'viem';

import { permit2Abi } from '../abis';
import {
  useEmbeddedWallet,
  usePublicClient,
  useSharedTelemetry,
  useSharedWalletSwapStatusContext,
  useWalletTransactions,
} from '../contexts';
import { solanaConnection } from '../utils';
import { getComputeUnitInstructions } from '../utils/SolanaUtils';
import { useRecordTransaction } from './useRecordTransaction';
import { useWalletRefresh } from './useWalletRefresh';

const SKIP_SIMULATION_CHAINS = ['arbitrum', 'unichain'];

export type SwapState =
  | 'pending'
  | 'succeeded'
  | 'approval-reverted'
  | 'swap-reverted'
  | 'error';

export type SwapError = {
  type: 'validation' | 'simulation' | 'other';
  code: ErrorPattern;
};

export class SolanaSimulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SolanaSimulationError';
  }
}

export type ExecuteSwapHookResult = {
  swapTxHash?: Hex;
  solanaTxHash?: string;
  approvalTxHash?: Hex;
  swapState?: SwapState;
  swapError?: SwapError;
  executeSwap: (
    quote: ApiSwapQuote,
    platformType: ApiPlatformType,
    attributedDomain?: string,
    onSuccess?: (hashes: string[]) => void,
    onError?: (reason: string) => void,
  ) => Promise<void>;
};

type SwapAnalyticsProperties = {
  version?: 'v3';
  chainId?: ApiChainId;
  buyToken?: string;
  sellToken?: string;
  usdValue?: number;
  gasless?: boolean;
  source?: string;
  erroredInInitiation?: boolean;
};

type ErrorPattern =
  | 'REPLACEMENT_UNDERPRICED'
  | 'FAILED_TO_SEND'
  | 'NO_HEALTHY_BACKEND'
  | 'NETWORK_DETECTION_FAILED'
  | 'WALLET_CONNECTION_TIMEOUT'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_GAS'
  | 'INTERNAL_ERROR'
  | 'OTHER'
  | 'TIMEOUT'
  | 'UNKNOWN';

const ERROR_PATTERNS: {
  needle: string;
  shortMessage: ErrorPattern;
}[] = [
  {
    needle: 'replacement transaction underpriced',
    shortMessage: 'REPLACEMENT_UNDERPRICED',
  },
  { needle: 'failed to send tx', shortMessage: 'FAILED_TO_SEND' },
  {
    needle: 'no backend is currently healthy',
    shortMessage: 'NO_HEALTHY_BACKEND',
  },
  {
    needle: 'could not detect network',
    shortMessage: 'NETWORK_DETECTION_FAILED',
  },
  {
    needle: 'Operation reached timeout: wallets:connect',
    shortMessage: 'WALLET_CONNECTION_TIMEOUT',
  },
  {
    needle: 'The total cost (gas * gas fee + value)',
    shortMessage: 'INSUFFICIENT_FUNDS',
  },
  {
    needle: 'insufficient funds for gas * price + value',
    shortMessage: 'INSUFFICIENT_FUNDS',
  },
  {
    needle: 'The amount of gas provided for the transaction is too low',
    shortMessage: 'INSUFFICIENT_GAS',
  },
  { needle: 'An internal error was received', shortMessage: 'INTERNAL_ERROR' },
  {
    needle: 'timed out while waiting for transaction',
    shortMessage: 'TIMEOUT',
  },
];

function getShortErrorMessage(error: unknown): [ErrorPattern, string] {
  if (!(error instanceof Error)) {
    return ['UNKNOWN', 'NotAnError'];
  }

  const errorName = error.name ?? 'NoErrorName';
  try {
    const pattern = ERROR_PATTERNS.find((p) => {
      const message = error.message.toLowerCase();
      return message.includes(p.needle.toLowerCase());
    });
    const shortMessage = pattern?.shortMessage ?? 'OTHER';
    return [shortMessage, errorName];
  } catch {
    return ['UNKNOWN', errorName];
  }
}

const getFailedSwapDiagnostics = (
  error: unknown,
  quote: ApiSwapQuote,
  approvalTxHash: Hex | undefined,
  swapTxHash: Hex | undefined,
) => {
  const [shortMessage, errorName] = getShortErrorMessage(error);
  const requestIds = quote.steps.map((step) => step.requestId);
  const stepTypes = quote.steps.map((step) => step.type);

  let failureStage = 'pre_transaction';
  if (approvalTxHash && !swapTxHash) {
    failureStage = 'post_approval';
  } else if (swapTxHash) {
    failureStage = 'post_swap_submission';
  }

  let errorStage = 'unknown';
  if (!swapTxHash && !approvalTxHash) {
    errorStage = 'initialization';
  } else if (approvalTxHash && !swapTxHash) {
    errorStage = 'after_approval';
  } else if (swapTxHash) {
    errorStage = 'transaction_submission';
  }

  return {
    approvalTxHash: approvalTxHash ?? 'N/A',
    swapTxHash: swapTxHash ?? 'N/A',
    requestIds,
    stepTypes,
    failureStage,
    errorStage,
    shortMessage,
    errorName,
  };
};

export const useExecuteSwap = (): ExecuteSwapHookResult => {
  const [approvalTxHash, setApprovalTxHash] = useState<Hex>();
  const [swapTxHash, setSwapTxHash] = useState<Hex>();
  const [solanaTxHash, setSolanaTxHash] = useState<string>();
  const [swapState, setSwapState] = useState<SwapState>();
  const [swapError, setSwapError] = useState<SwapError>();
  const successfullySubmitted = useRef<Map<string, string>>(new Map());

  const {
    getWalletClient,
    evmAddress,
    transactionCounterRef,
    solanaAddress,
    addPendingTransaction,
    removePendingTransaction,
  } = useEmbeddedWallet();
  const { getEthereumClient } = usePublicClient();
  const { trackEvent, trackError } = useSharedTelemetry();
  const recordWalletTransaction = useRecordTransaction();
  const refreshWallet = useWalletRefresh();
  const attributedDomainRef = useRef<string | undefined>(undefined);
  const { submitTransaction } = useWalletTransactions();
  const { onSuccess: onSwapStatusSuccess } = useSharedWalletSwapStatusContext();

  const executeSwap = useCallback(
    async (
      quote: ApiSwapQuote,
      platformType: ApiPlatformType,
      attributedDomain?: string,
      onSuccess?: (hashes: string[]) => void,
      onError?: (reason: string) => void,
    ) => {
      if (!evmAddress) {
        throw new Error('No EVM address found');
      }

      setSwapState('pending');
      setSwapError(undefined);
      if (attributedDomain) {
        attributedDomainRef.current = attributedDomain;
      }
      const analyticsProperties: SwapAnalyticsProperties = (() => {
        try {
          const fillSources =
            ('raw' in quote &&
              (
                quote.raw as { route?: { fills?: { source: string }[] } }
              )?.route?.fills?.map((fill) => fill.source)) ??
            [];

          return {
            version: 'v3',
            chainId: quote.price.sell.token.chainId,
            gasless: quote.route === '0x-gasless',
            buyToken: tokenAnalyticsName({
              chainId: quote.price.buy.token.chainId ?? -1,
              address: quote.price.buy.token.address,
              symbol: quote.price.buy.token.symbol,
            }),
            sellToken: tokenAnalyticsName({
              chainId: quote.price.sell.token.chainId ?? -1,
              address: quote.price.sell.token.address,
              symbol: quote.price.sell.token.symbol,
            }),
            usdValue: tokenQuantityToUsdFloat({
              price: quote.price.buy.token.price ?? 0,
              decimals: quote.price.buy.token.decimals ?? ETHER_DECIMALS,
              quantity: quote.price.buy.amount
                ? BigInt(quote.price.buy.amount)
                : 0n,
            }),
            source: quote.route,
            fillSources,
          };
        } catch {
          return {
            version: 'v3',
            erroredInInitiation: true,
          };
        }
      })();

      let swapTxHash: Hex | undefined;

      const recordTransaction = async (
        protocol: 'solana' | 'ethereum',
        txHash: string,
        status: 'succeeded' | 'swap-reverted',
      ) => {
        const metadata = {
          uid: quote.uid,
          type: 'swap' as const,
          status,
          quote,
        };
        try {
          removePendingTransaction(txHash);
          const chainId =
            protocol === 'solana' ? undefined : quote.price.sell.token.chainId;
          await recordWalletTransaction({
            domain: attributedDomainRef.current,
            platformType,
            txHash,
            walletAddress: protocol === 'solana' ? solanaAddress! : evmAddress!,
            chain: protocol === 'solana' ? 'solana' : 'eth',
            chainId,
            metadata,
          });
        } catch (e) {
          trackError(e);
        }
      };

      const handleError = (
        protocol: 'ethereum' | 'solana',
        e?: Error,
        txHash?: string,
      ) => {
        if (txHash) {
          recordTransaction(protocol, txHash, 'swap-reverted');
        }

        onError?.('swap_failed');

        if (e) {
          setSwapState('error');
          const extraProperties = getFailedSwapDiagnostics(
            e,
            quote,
            approvalTxHash,
            txHash as `0x${string}` | undefined,
          );
          trackEvent(AnalyticsEvent.SwapWalletTransactionError, {
            error: e instanceof Error ? `${e.name}: ${e.message}` : 'unknown',
            ...analyticsProperties,
            ...extraProperties,
          });

          const [code] = getShortErrorMessage(e);
          setSwapError({
            type: 'other',
            code,
          });

          if (e instanceof Error) {
            trackError(new Error(`error executing swap: ${e.message}`), {
              cause: e,
            });
          }
        } else {
          setSwapState('swap-reverted');
          trackEvent(
            AnalyticsEvent.SwapWalletTransactionReverted,
            analyticsProperties,
          );
        }
      };

      const handleSuccess = (
        protocol: 'ethereum' | 'solana',
        txHash: string,
      ) => {
        setSwapState('succeeded');
        recordTransaction(protocol, txHash, 'succeeded');
        if (protocol === 'solana') {
          setSolanaTxHash(txHash);
        } else {
          setSwapTxHash(txHash as `0x${string}`);
        }

        onSuccess?.(approvalTxHash ? [approvalTxHash, txHash] : [txHash]);

        onSwapStatusSuccess();

        trackEvent(
          AnalyticsEvent.SwapWalletTransactionSucceeded,
          analyticsProperties,
        );

        transactionCounterRef.current += 1;
        if (quote) {
          const sellChainId = quote.price.sell.token.chainId!;
          const sellToken = {
            chain: chainIdToChainOrThrow(sellChainId.toString()),
            ca: quote.price.sell.token.address,
            decimals: quote.price.sell.token.decimals,
          };

          const buyChainId = quote.price.buy.token.chainId!;
          const buyChain = chainIdToChainOrThrow(buyChainId.toString());

          const buyQuantityInt =
            quote.price.buy.minAmount ?? quote.price.buy.amount ?? '0';
          const buyQuantityFloat = parseFloat(
            formatUnits(
              BigInt(buyQuantityInt),
              quote.price.buy.token.decimals ?? 9,
            ),
          );

          const buyPosition: ApiEthFungibleTokenPosition = {
            id: quote.price.buy.token.address ?? 'native',
            quantity: {
              float: buyQuantityFloat,
              int: buyQuantityInt,
            },
            chain: buyChain,
            name: quote.price.buy.token.name,
            symbol: quote.price.buy.token.symbol,
            price: quote.price.buy.token.price,
            value: quote.price.buy.value
              ? quote.price.buy.value
              : quote.price.buy.token.price
                ? quote.price.buy.token.price * buyQuantityFloat
                : undefined,
            iconUrl: quote.price.buy.token.iconUrl,
            address: quote.price.buy.token.address,
            decimals: quote.price.buy.token.decimals,
            features: {
              canTrade: true,
              isTestnet: false,
            },
          };

          const buyToken = {
            chain: chainIdToChainOrThrow(buyChainId.toString()),
            ca: quote.price.buy.token.address,
            decimals: quote.price.buy.token.decimals,
            position: buyPosition,
          };

          refreshWallet([
            sellToken,
            {
              ...buyToken,
              delta:
                sellToken.chain !== buyToken.chain
                  ? (quote.price.buy.minAmount ?? quote.price.buy.amount)
                  : undefined,
            },
          ]);
        }
      };

      try {
        const apiChain = quote.price.sell.token.chain as ApiChain;
        const chain = apiChainToViemChainOrThrow(apiChain);
        const publicClient = getEthereumClient({
          chain,
        });

        trackEvent(AnalyticsEvent.SwapWalletTransaction, analyticsProperties);

        let approvalTxHash: Hex;
        if (quote.route === '0x-gasless') {
          const buildTransaction = async () => {
            return {
              quote,
              requestId: successfullySubmitted.current.get(quote.uid),
            };
          };

          const onProcessed = (requestId: string) => {
            successfullySubmitted.current.set(quote.uid, requestId);
          };

          const onError = (error?: Error, txHash?: string) => {
            handleError('ethereum', error, txHash);
          };

          const onSuccess = (txHash: string) => {
            handleSuccess('ethereum', txHash);
          };

          const args = {
            protocol: 'ethereum-gasless' as const,
            chain: apiChain,
            buildTransaction,
            onProcessed,
            onSuccess,
            onError,
            metadata: {
              type: 'swap' as const,
              quote,
            },
          };

          submitTransaction(args);
          return;
        } else if (quote.route === '0x-permit2') {
          const { steps } = quote;

          if (steps.length === 1 && steps[0].type === 'transaction') {
            // Native token swap:
            // 1. Send transaction
            const [transaction] = steps;
            if (
              transaction.items[0].type === 'transaction' &&
              'data' in transaction.items[0].data
            ) {
              const buildTransaction = async () => {
                const txData = transaction.items[0].data;
                if (!('data' in txData)) {
                  throw new Error('Relay must provide transaction data');
                }

                const request = {
                  type: 'eip1559' as const,
                  to: txData.to as Hex,
                  data: txData.data as Hex,
                  value: BigInt(txData.value),
                  chain: chain,
                  gas: txData.gas ? BigInt(txData.gas) : undefined,
                  maxFeePerGas: txData.maxFeePerGas
                    ? BigInt(txData.maxFeePerGas)
                    : undefined,
                  maxPriorityFeePerGas: txData.maxPriorityFeePerGas
                    ? BigInt(txData.maxPriorityFeePerGas)
                    : undefined,
                  account: evmAddress,
                };

                if (!SKIP_SIMULATION_CHAINS.includes(apiChain)) {
                  try {
                    const simulation = await publicClient.simulateCalls({
                      account: evmAddress,
                      calls: [request],
                    });

                    const result = simulation.results[0];
                    if (result.error) {
                      throw result.error;
                    }
                  } catch (e) {
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

                return request;
              };

              const onProcessed = (txHash: string) => {
                addPendingTransaction({
                  chain: apiChain,
                  txHash,
                  metadata: {
                    type: 'swap',
                    quote,
                  },
                });
                setSwapTxHash(swapTxHash);
              };

              const onError = (error?: Error, txHash?: string) => {
                handleError('ethereum', error, txHash);
              };

              const onSuccess = (txHash: string) => {
                handleSuccess('ethereum', txHash);
              };

              const args = {
                protocol: 'ethereum' as const,
                chain: apiChain,
                buildTransaction,
                onProcessed,
                onSuccess,
                onError,
                metadata: {
                  type: 'swap' as const,
                  quote,
                },
              };

              submitTransaction(args);
              return;
            } else {
              throw new Error('Unknown item type');
            }
          } else if (
            steps.length === 2 &&
            steps[0].type === 'permit2' &&
            steps[1].type === 'transaction'
          ) {
            // ERC20 to ERC20 swap:
            // 1. Check and optionally set allowance
            // 2. Sign Permit2 approval
            // 3. Send transaction
            const [approval, transaction] = steps;

            if (
              approval.items[0].type === 'signature' &&
              approval.items[0].data.type === 'permit2'
            ) {
              // First, generate Permit2 signature
              const signatureData = approval.items[0].data;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { type, hash, ...eip712 } = signatureData;

              // Send tx with appended Permit2 signature
              if (
                transaction.items[0].type === 'transaction' &&
                'data' in transaction.items[0].data
              ) {
                const buildTransaction = async () => {
                  const walletClient = await getWalletClient(chain);
                  const Permit2 = getContract({
                    address: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
                    abi: permit2Abi,
                    client: walletClient,
                  });
                  const erc20 = getContract({
                    address: quote.price.sell.token.address as Hex,
                    abi: erc20Abi,
                    client: walletClient,
                  });
                  const allowance = await erc20.read.allowance([
                    walletClient.account.address,
                    Permit2.address,
                  ]);
                  if (BigInt(quote.price.sell.amount ?? '0') > allowance) {
                    const { request } = await erc20.simulate.approve([
                      Permit2.address,
                      maxUint256,
                    ]);

                    approvalTxHash = await erc20.write.approve(request.args);
                    setApprovalTxHash(approvalTxHash);

                    const tries = 0;
                    do {
                      try {
                        const approvalReceipt =
                          await publicClient.waitForTransactionReceipt({
                            hash: approvalTxHash,
                          });
                        if (approvalReceipt.status !== 'success') {
                          setSwapState('approval-reverted');
                          throw new Error('Approval reverted');
                        }
                        break;
                      } catch (e) {
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1000),
                        );
                      }
                    } while (tries < 5);
                    // Artificial delay to ensure the approval is processed across nodes
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                  }

                  const signature = await walletClient.signTypedData(
                    eip712 as SignTypedDataParameters,
                  );

                  // Append length and signature to tx calldata
                  const length = numberToHex(size(signature), {
                    signed: false,
                    size: 32,
                  });
                  const tag = concat([length, signature]);

                  const txData = transaction.items[0].data;
                  if (!('data' in txData)) {
                    throw new Error('Relay must provide transaction data');
                  }

                  const request = {
                    type: 'eip1559' as const,
                    to: txData.to as Hex,
                    data: concat([txData.data as Hex, tag]),
                    value: BigInt(txData.value),
                    chain: chain,
                    gas: txData.gas ? BigInt(txData.gas) : undefined,
                    maxFeePerGas: txData.maxFeePerGas
                      ? BigInt(txData.maxFeePerGas)
                      : undefined,
                    maxPriorityFeePerGas: txData.maxPriorityFeePerGas
                      ? BigInt(txData.maxPriorityFeePerGas)
                      : undefined,
                    account: evmAddress,
                  };

                  if (!SKIP_SIMULATION_CHAINS.includes(apiChain)) {
                    try {
                      const simulation = await publicClient.simulateCalls({
                        account: evmAddress,
                        calls: [request],
                      });

                      const result = simulation.results[0];
                      if (result.error) {
                        throw result.error;
                      }
                    } catch (e) {
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

                  return request;
                };

                const onProcessed = (txHash: string) => {
                  addPendingTransaction({
                    chain: apiChain,
                    txHash,
                    metadata: {
                      type: 'swap',
                      quote,
                    },
                  });
                  setSwapTxHash(swapTxHash);
                };

                const onError = (error?: Error, txHash?: string) => {
                  handleError('ethereum', error, txHash);
                };

                const onSuccess = (txHash: string) => {
                  handleSuccess('ethereum', txHash);
                };

                const args = {
                  protocol: 'ethereum' as const,
                  chain: apiChain,
                  buildTransaction,
                  onProcessed,
                  onSuccess,
                  onError,
                  metadata: {
                    type: 'swap' as const,
                    quote,
                  },
                };

                submitTransaction(args);
                return;
              } else {
                throw new Error('Unknown item type');
              }
            } else {
              throw new Error('Unknown item type');
            }
          } else {
            throw new Error('Unknown swap type');
          }
        } else if (
          quote.route === 'relay' ||
          quote.route === 'gaszip' ||
          quote.route === 'liquidswap'
        ) {
          const { steps } = quote;

          if (steps.length === 1 && steps[0].type === 'transaction') {
            // Single step cross-chain relay:
            // 1. Send transaction
            const [transaction] = steps;
            if (transaction.items[0].type === 'transaction') {
              // EVM
              if ('data' in transaction.items[0].data) {
                const buildTransaction = async () => {
                  const txData = transaction.items[0].data;
                  if (!('data' in txData)) {
                    throw new Error('Relay must provide transaction data');
                  }

                  const request = {
                    type: 'eip1559' as const,
                    to: txData.to as Hex,
                    data: txData.data as Hex,
                    value: BigInt(txData.value),
                    chain: chain,
                    gas: txData.gas ? BigInt(txData.gas) : undefined,
                    maxFeePerGas: txData.maxFeePerGas
                      ? BigInt(txData.maxFeePerGas)
                      : undefined,
                    maxPriorityFeePerGas: txData.maxPriorityFeePerGas
                      ? BigInt(txData.maxPriorityFeePerGas)
                      : undefined,
                    account: evmAddress,
                  };

                  if (!SKIP_SIMULATION_CHAINS.includes(apiChain)) {
                    try {
                      const simulation = await publicClient.simulateCalls({
                        account: evmAddress,
                        calls: [request],
                      });

                      const result = simulation.results[0];
                      if (result.error) {
                        throw result.error;
                      }
                    } catch (e) {
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

                  return request;
                };

                const onProcessed = (txHash: string) => {
                  addPendingTransaction({
                    chain: apiChain,
                    txHash,
                    metadata: {
                      type: 'swap',
                      quote,
                    },
                  });
                  setSwapTxHash(swapTxHash);
                };

                const onError = (error?: Error, txHash?: string) => {
                  handleError('ethereum', error, txHash);
                };

                const onSuccess = (txHash: string) => {
                  handleSuccess('ethereum', txHash);
                };

                const args = {
                  protocol: 'ethereum' as const,
                  chain: apiChain,
                  buildTransaction,
                  onProcessed,
                  onSuccess,
                  onError,
                  metadata: {
                    type: 'swap' as const,
                    quote,
                  },
                };

                submitTransaction(args);
                return;

                // Solana
              } else {
                if (!solanaAddress) {
                  throw new Error('Solana address is not available');
                }

                if (transaction.items[0].data.type === 'serialized') {
                  throw new Error('Relay must provide instructions');
                }

                const instructions = transaction.items[0].data.instructions;
                const lookupTableAddresses =
                  transaction.items[0].data.addressLookupTableAddresses;

                const buildTransaction = async () => {
                  const fetchAddressLookupTableAccounts = async () => {
                    const addressLookupTableAccountInfos =
                      await solanaConnection.getMultipleAccountsInfo(
                        lookupTableAddresses.map((key) => new PublicKey(key)),
                      );

                    return addressLookupTableAccountInfos.reduce(
                      (acc, accountInfo, index) => {
                        const addressLookupTableAddress =
                          lookupTableAddresses[index];
                        if (accountInfo) {
                          const addressLookupTableAccount =
                            new AddressLookupTableAccount({
                              key: new PublicKey(addressLookupTableAddress),
                              state: AddressLookupTableAccount.deserialize(
                                Uint8Array.from(accountInfo.data),
                              ),
                            });
                          acc.push(addressLookupTableAccount);
                        }

                        return acc;
                      },
                      new Array<AddressLookupTableAccount>(),
                    );
                  };

                  const [{ blockhash }, addressLookupTableAccounts] =
                    await Promise.all([
                      solanaConnection.getLatestBlockhash(),
                      fetchAddressLookupTableAccounts(),
                    ]);

                  const transactionMessage = new TransactionMessage({
                    payerKey: new PublicKey(solanaAddress),
                    recentBlockhash: blockhash,
                    instructions: instructions.map((instruction) => ({
                      keys: instruction.keys.map((key) => ({
                        ...key,
                        pubkey: new PublicKey(key.pubkey),
                      })),
                      programId: new PublicKey(instruction.programId),
                      data: Buffer.from(instruction.data, 'hex'),
                    })),
                  });

                  const solanaTransaction = new VersionedTransaction(
                    transactionMessage.compileToV0Message(
                      addressLookupTableAccounts,
                    ),
                  );

                  let unitsConsumed: number | undefined;
                  try {
                    const simulation =
                      await solanaConnection.simulateTransaction(
                        solanaTransaction,
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

                      throw new Error(message);
                    }
                    unitsConsumed = simulation.value.unitsConsumed;
                  } catch (e) {
                    const message =
                      e instanceof Error ? e.message : 'Unknown error';
                    throw new SolanaSimulationError(message);
                  }

                  transactionMessage.instructions.unshift(
                    ...getComputeUnitInstructions(unitsConsumed),
                  );

                  return new VersionedTransaction(
                    transactionMessage.compileToV0Message(
                      addressLookupTableAccounts,
                    ),
                  );
                };

                const onSuccess = (txHash: string) => {
                  handleSuccess('solana', txHash);
                };

                const onError = (error?: Error, txHash?: string) => {
                  handleError('solana', error, txHash);
                };

                const args = {
                  chain: 'solana' as const,
                  protocol: 'solana' as const,
                  buildTransaction,
                  onSuccess,
                  onError,
                  metadata: {
                    type: 'swap' as const,
                    quote,
                  },
                };

                submitTransaction(args);
                return;
              }
            } else {
              throw new Error('Unknown item type');
            }
          } else if (
            steps.length === 2 &&
            steps[0].name === 'approve' &&
            steps[0].type === 'transaction' &&
            steps[1].type === 'transaction'
          ) {
            // Two step cross-chain ERC20 relay:
            // 1. Send ERC20 approval transaction
            // 2. Send relay transaction
            const [approval, transaction] = steps;

            if (
              approval.items[0].type === 'transaction' &&
              'data' in approval.items[0].data &&
              transaction.items[0].type === 'transaction' &&
              'data' in transaction.items[0].data
            ) {
              const buildTransaction = async () => {
                const txData = transaction.items[0].data;
                if (!('data' in txData)) {
                  throw new Error('Relay must provide transaction data');
                }

                const approvalData = approval.items[0].data;
                if (!('data' in approvalData)) {
                  throw new Error('Relay must provide transaction data');
                }

                const approvalRequest = {
                  to: approvalData.to as Hex,
                  data: approvalData.data as Hex,
                  value: BigInt(approvalData.value),
                  chain: chain,
                  gas: approvalData.gas ? BigInt(approvalData.gas) : undefined,
                  maxFeePerGas: approvalData.maxFeePerGas
                    ? BigInt(approvalData.maxFeePerGas)
                    : undefined,
                  maxPriorityFeePerGas: approvalData.maxPriorityFeePerGas
                    ? BigInt(approvalData.maxPriorityFeePerGas)
                    : undefined,
                };

                const walletClient = await getWalletClient(chain);
                approvalTxHash =
                  await walletClient.sendTransaction(approvalRequest);
                setApprovalTxHash(approvalTxHash);

                const tries = 0;
                do {
                  try {
                    const approvalReceipt =
                      await publicClient.waitForTransactionReceipt({
                        hash: approvalTxHash,
                      });
                    if (approvalReceipt.status !== 'success') {
                      setSwapState('approval-reverted');
                      throw new Error('Approval reverted');
                    }
                    break;
                  } catch (e) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                  }
                } while (tries < 5);
                // Artificial delay to ensure the approval is processed across nodes
                await new Promise((resolve) => setTimeout(resolve, 3000));

                const request = {
                  type: 'eip1559' as const,
                  to: txData.to as Hex,
                  data: txData.data as Hex,
                  value: BigInt(txData.value),
                  chain: chain,
                  gas: txData.gas ? BigInt(txData.gas) : undefined,
                  maxFeePerGas: txData.maxFeePerGas
                    ? BigInt(txData.maxFeePerGas)
                    : undefined,
                  maxPriorityFeePerGas: txData.maxPriorityFeePerGas
                    ? BigInt(txData.maxPriorityFeePerGas)
                    : undefined,
                  account: evmAddress,
                };

                if (!SKIP_SIMULATION_CHAINS.includes(apiChain)) {
                  try {
                    const simulation = await publicClient.simulateCalls({
                      account: evmAddress,
                      calls: [request],
                    });

                    const result = simulation.results[0];
                    if (result.error) {
                      throw result.error;
                    }
                  } catch (e) {
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

                return request;
              };

              const onProcessed = (txHash: string) => {
                addPendingTransaction({
                  chain: apiChain,
                  txHash,
                  metadata: {
                    type: 'swap',
                    quote,
                  },
                });
                setSwapTxHash(swapTxHash);
              };

              const onError = (error?: Error, txHash?: string) => {
                handleError('ethereum', error, txHash);
              };

              const onSuccess = (txHash: string) => {
                handleSuccess('ethereum', txHash);
              };

              const args = {
                protocol: 'ethereum' as const,
                chain: apiChain,
                buildTransaction,
                onProcessed,
                onSuccess,
                onError,
                metadata: {
                  type: 'swap' as const,
                  quote,
                },
              };

              submitTransaction(args);
              return;
            } else {
              throw new Error('Unknown item type');
            }
          } else {
            throw new Error('Unknown swap type');
          }
        } else if (quote.route === 'jupiter') {
          const data = quote.steps[0]?.items[0];
          if (
            !data ||
            data.type !== 'transaction' ||
            data.protocol !== 'solana'
          ) {
            throw new Error('Invalid data for Jupiter route');
          }

          if (!solanaAddress) {
            throw new Error('Solana address is not available');
          }

          const buildTransaction = async () => {
            if (data.data.type === 'serialized') {
              return VersionedTransaction.deserialize(
                new Uint8Array(Buffer.from(data.data.transaction, 'base64')),
              );
            } else {
              const instructions = data.data.instructions;
              const lookupTableAddresses =
                data.data.addressLookupTableAddresses;

              const fetchAddressLookupTableAccounts = async () => {
                const addressLookupTableAccountInfos =
                  await solanaConnection.getMultipleAccountsInfo(
                    lookupTableAddresses.map((key) => new PublicKey(key)),
                  );

                return addressLookupTableAccountInfos.reduce(
                  (acc, accountInfo, index) => {
                    const addressLookupTableAddress =
                      lookupTableAddresses[index];
                    if (accountInfo) {
                      const addressLookupTableAccount =
                        new AddressLookupTableAccount({
                          key: new PublicKey(addressLookupTableAddress),
                          state: AddressLookupTableAccount.deserialize(
                            Uint8Array.from(accountInfo.data),
                          ),
                        });
                      acc.push(addressLookupTableAccount);
                    }

                    return acc;
                  },
                  new Array<AddressLookupTableAccount>(),
                );
              };

              const [{ blockhash }, addressLookupTableAccounts] =
                await Promise.all([
                  solanaConnection.getLatestBlockhash(),
                  fetchAddressLookupTableAccounts(),
                ]);

              const transactionMessage = new TransactionMessage({
                payerKey: new PublicKey(solanaAddress),
                recentBlockhash: blockhash,
                instructions: instructions.map((instruction) => ({
                  keys: instruction.keys.map((key) => ({
                    ...key,
                    pubkey: new PublicKey(key.pubkey),
                  })),
                  programId: new PublicKey(instruction.programId),
                  data: Buffer.from(instruction.data, 'hex'),
                })),
              });

              const solanaTransaction = new VersionedTransaction(
                transactionMessage.compileToV0Message(
                  addressLookupTableAccounts,
                ),
              );

              let unitsConsumed: number | undefined;
              try {
                const simulation =
                  await solanaConnection.simulateTransaction(solanaTransaction);

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

                  throw new Error(message);
                }
                unitsConsumed = simulation.value.unitsConsumed;
              } catch (e) {
                const message =
                  e instanceof Error ? e.message : 'Unknown error';
                throw new SolanaSimulationError(message);
              }

              transactionMessage.instructions.unshift(
                ...getComputeUnitInstructions(unitsConsumed),
              );

              return new VersionedTransaction(
                transactionMessage.compileToV0Message(
                  addressLookupTableAccounts,
                ),
              );
            }
          };

          const onSuccess = (txHash: string) => {
            handleSuccess('solana', txHash);
          };

          const onError = (error?: Error, txHash?: string) => {
            handleError('solana', error, txHash);
          };

          const args = {
            protocol: 'solana' as const,
            chain: 'solana' as const,
            buildTransaction,
            onSuccess,
            onError,
            metadata: {
              type: 'swap' as const,
              quote,
            },
          };

          submitTransaction(args);
          return;
        } else {
          throw new Error('Unknown swap route');
        }
      } catch (e) {
        handleError(
          quote.price.sell.token.chain === 'solana' ? 'solana' : 'ethereum',
          e as Error,
          swapTxHash,
        );
      }
    },
    [
      addPendingTransaction,
      approvalTxHash,
      evmAddress,
      getEthereumClient,
      getWalletClient,
      onSwapStatusSuccess,
      recordWalletTransaction,
      refreshWallet,
      removePendingTransaction,
      solanaAddress,
      submitTransaction,
      trackError,
      trackEvent,
      transactionCounterRef,
    ],
  );

  return {
    executeSwap,
    approvalTxHash,
    swapTxHash,
    solanaTxHash,
    swapState,
    swapError,
  };
};
