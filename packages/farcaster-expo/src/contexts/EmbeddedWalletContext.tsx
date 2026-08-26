import {
  SolanaCombinedTransaction,
  SolanaConnectRequestArguments,
  SolanaSignMessageRequestArguments,
  SolanaSignTransactionRequestArguments,
} from '@farcaster/miniapp-core';
import {
  apiChainToViemChainOrThrow,
  ApiEthSendTransactionRequest,
  ApiEthSignTypedDataV4Request,
  ApiFarcasterWalletAction,
  ApiWalletEvmScanAction200Response,
  ApiWalletSolScanAction200Response,
  chainIdToChain,
} from 'farcaster-client-data';
import {
  sleep,
  useEmbeddedWalletsQuery,
  useRecordWalletTransaction,
} from 'farcaster-client-hooks';
import * as Provider from 'ox/Provider';
import type * as RpcSchema from 'ox/RpcSchema';
import React, {
  createContext,
  MutableRefObject,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Hex, isHex, toHex } from 'viem';

import { useCurrentUserFid } from '../hooks/useCurrentUser';
import { useSecondaryWalletsEnabled } from '../hooks/useSecondaryWalletsEnabled';
import {
  PendingTransaction,
  PendingTransactionData,
  PendingTransactionResult,
  useWalletPendingTransactions,
} from '../hooks/useWalletPendingTransactions';
import {
  Call,
  CallReceipt,
  CallReceiptSchema,
  ConnectionContext,
  EvmWalletProvider,
  GetCapabilitiesSingleSchema,
  GetWalletClient,
  PreviewRequest,
  SolanaRequestFnWithConn,
  SolanaSignAndSendTransactionRequestWithConnArguments,
  SolanaWalletProviderWithConn,
  WalletGetCallsStatusResponse,
  WalletSendCallsParams,
  WalletSendCallsParamsSchema,
  WalletSendCallsResponse,
} from '../types';
import { parseSendCalls } from '../utils';
import { logErrorInDevOnly, logInDevOnly } from '../utils/LogUtils';
import {
  createSolanaWalletProviderWithConn,
  waitForSolanaTransaction,
} from '../utils/SolanaUtils';
import { usePublicClient } from './PublicClientProvider';
import { WalletTransactionsProvider } from './WalletTransactionsProvider';

export type SiwfAuth = {
  message: string;
  signature: string;
  fid: number;
};

type BaseEmbeddedWalletContextType = {
  initConnect?: () => Promise<{
    nonce: string;
    expiresAt: string;
  }>;
  connect: (input?: SiwfAuth) => Promise<void>;
  disconnect: () => Promise<void>;
  createPrivateWallet: (options?: {
    protocols?: ('ethereum' | 'solana')[];
  }) => Promise<{
    ethereum?: { address: `0x${string}` };
    solana?: { address: string };
  }>;
  isReady: boolean;
  isInitializing: boolean;
  isConnected: boolean;
  // Whether the signer for the *active* wallet is resolved and ready to sign.
  // Primary wallets are ready as soon as connected; secondary (private) wallets
  // live in a separate Privy app whose provider warms asynchronously after a
  // wallet switch. Undefined (e.g. web, which has no secondary app) is treated
  // as ready by consumers. Used to gate the swap CTA so a tap can't land on a
  // not-yet-ready secondary signer.
  isActiveWalletSignerReady?: boolean;

  // Utilities
  getConnectionContext: () =>
    | Promise<ConnectionContext | undefined>
    | (ConnectionContext | undefined);
  // TODO: Remove connectionContextRef once we refactor mobile wallet providers
  // Use getConnectionContext to get the active connection context
  connectionContextRef: MutableRefObject<ConnectionContext | undefined>;

  // EVM wallet context
  evmAddress?: Hex;
  activeWalletId?: string;
  evmProvider: EvmWalletProvider;
  miniAppActiveWalletId?: string;
  miniAppEvmAddress?: Hex;
  miniAppEvmProvider?: EvmWalletProvider;
  getWalletClient: GetWalletClient;

  // Solana wallet context
  solanaAddress?: string;
  solanaProvider: SolanaWalletProviderWithConn;
  miniAppSolanaAddress?: string;
  miniAppSolanaProvider?: SolanaWalletProviderWithConn;

  // Feature flags
  applyLimitedFunctionality: boolean;
  swapAggregation: boolean;

  // IAP payment flow for mobile only
  handlePayForProWithIAP: () => void;
};

type OptionalEvmAddressType =
  | {
      isConnected: true;
      evmAddress: Hex;
    }
  | {
      isConnected: false;
    };

function isEvmScanAction(
  action: ApiFarcasterWalletAction,
): action is ApiEthSendTransactionRequest | ApiEthSignTypedDataV4Request {
  return (
    action.method === 'eth_sendTransaction' ||
    action.method === 'eth_signTypedData_v4'
  );
}

type ScanResults = {
  scanResponse:
    | ApiWalletEvmScanAction200Response['result']
    | ApiWalletSolScanAction200Response['result'];
  action: ApiFarcasterWalletAction;
};

interface TransactionCallResult {
  txHash: string | null;
  error: string | null;
  receipt: CallReceipt | null;
}

// This contains all data related to the calls in a batch
interface BatchCallsStorage {
  request: WalletSendCallsParams;
  results: Map<number, TransactionCallResult>;
}

type EmbeddedWalletContextTypeInput = BaseEmbeddedWalletContextType &
  OptionalEvmAddressType;

export type EmbeddedWalletContextType = Omit<
  EmbeddedWalletContextTypeInput,
  'evmProvider' | 'solanaProvider'
> &
  OptionalEvmAddressType & {
    evmMiniAppProvider: EvmWalletProvider;
    solanaMiniAppProvider: SolanaWalletProviderWithConn;
    solanaWalletProvider: SolanaWalletProviderWithConn;
    previewRequest?: PreviewRequest;
    scanResultsMap: Map<string | SolanaCombinedTransaction, ScanResults>;
    transactionCounterRef: MutableRefObject<number>;
    // Set by a dispatching surface immediately before calling the preview
    // provider so the resulting preview is attributed to that surface's
    // connection context rather than the shared ref (NEYN-12452).
    pendingConnectionContextRef: MutableRefObject<
      ConnectionContext | undefined
    >;
    // Clear all preview requests (used when mini app is minimized/closed)
    clearPreviewRequests: () => void;
    // Pending transactions (OLD)
    addPendingTransaction: (data: PendingTransactionData) => PendingTransaction;
    removePendingTransaction: (txHash: string) => void;
    pendingTransactions: PendingTransaction[];
    getPendingTransaction: (txHash: string) => PendingTransactionResult;
  };

export const EmbeddedWalletContext = createContext<
  EmbeddedWalletContextType | undefined
>(undefined);

// ERC20 approve method signature
const ERC20_APPROVE_METHOD_SIGNATURE = '0x095ea7b3';

/**
 * Determines if transactions should be executed sequentially based on approval patterns.
 * Sequential execution is used when there are non-approval transactions that depend on
 * earlier approval transactions (e.g., approve then swap/transfer pattern).
 *
 * @param calls - Array of transaction calls to analyze
 * @returns true if sequential execution should be used, false for parallel execution
 */
function shouldUseSequentialExecution(calls: Call[]): boolean {
  // Only consider sequential mode for small batches
  if (calls.length > 5) {
    return false;
  }

  // Find the index of the first approval transaction
  const firstApprovalIndex = calls.findIndex(
    (call) => call.data && call.data.startsWith(ERC20_APPROVE_METHOD_SIGNATURE),
  );

  // No approvals, use parallel execution
  if (firstApprovalIndex === -1) {
    return false;
  }

  // Check if there are any non-approval transactions after the first approval
  for (let i = firstApprovalIndex + 1; i < calls.length; i++) {
    const call = calls[i];
    if (!call.data || !call.data.startsWith(ERC20_APPROVE_METHOD_SIGNATURE)) {
      // Found a non-approval after an approval - indicates dependency pattern
      return true;
    }
  }

  // All transactions after the first approval are also approvals
  return false;
}

export function EmbeddedWalletProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: EmbeddedWalletContextTypeInput;
}) {
  const { getEthereumClient } = usePublicClient();
  const recordWalletTransaction = useRecordWalletTransaction();
  const pendingTransactions = useWalletPendingTransactions();
  const { addPendingTransaction, removePendingTransaction } =
    pendingTransactions;
  const [previewRequests, setPreviewRequests] = useState<PreviewRequest[]>([]);
  const previewRequestIdRef = useRef(0);
  const processedBatchIds = useRef<Set<string>>(new Set());
  const batchCallsStorageRef = useRef<Map<string, BatchCallsStorage>>(
    new Map(),
  );

  const transactionCounterRef = useRef(0);
  const scanResultsMapRef = useRef<
    Map<string | SolanaCombinedTransaction, ScanResults>
  >(new Map());

  // Set synchronously by a dispatching surface (e.g. the in-app browser) right
  // before it calls the preview provider, and consumed once at the top of the
  // preview request handler. Lets a preview carry the context of the surface
  // that actually originated it instead of reading the shared, last-writer-wins
  // connectionContextRef at preview time (NEYN-12452).
  const pendingConnectionContextRef = useRef<ConnectionContext | undefined>(
    undefined,
  );

  const { evmProvider, solanaProvider } = value;

  // `forwarded` is destructured from `value` (everything except the two
  // providers pulled out above) and spread into the context value below.
  // Destructuring produces a fresh object on every render, so memoize it keyed
  // on `value` itself. This only pays off when callers pass a stable `value`
  // (today both MobileEmbeddedWalletProvider and WebEmbeddedWalletProvider
  // `useMemo` it, so its identity changes only when underlying wallet state
  // does, keeping the context value stable across unrelated re-renders). If a
  // caller ever passes an unmemoized `value`, this memo is a harmless no-op
  // rather than a correctness bug — it never drops a real state update.
  const forwarded = React.useMemo(() => {
    const {
      evmProvider: _evmProvider,
      solanaProvider: _solanaProvider,
      ...rest
    } = value;
    return rest;
  }, [value]);

  const {
    activeWalletId,
    evmAddress,
    miniAppActiveWalletId,
    miniAppEvmAddress,
    miniAppEvmProvider = evmProvider,
    miniAppSolanaAddress,
    miniAppSolanaProvider = solanaProvider,
    getConnectionContext,
    isConnected,
  } = forwarded;
  const resolvedMiniAppEvmAddress = miniAppEvmAddress;
  const resolvedMiniAppSolanaAddress = miniAppSolanaAddress;
  const fid = useCurrentUserFid();
  const secondaryWalletsEnabled = useSecondaryWalletsEnabled();
  const { data: embeddedWalletsData } = useEmbeddedWalletsQuery({
    params: { includePrivate: true },
    scopeKey: fid,
    enabled: secondaryWalletsEnabled && !!fid,
  });
  const evmWalletId = useMemo(
    () =>
      activeWalletId ??
      embeddedWalletsData?.wallets.find(
        (wallet) =>
          wallet.protocol === 'ethereum' &&
          wallet.address.toLowerCase() === evmAddress?.toLowerCase(),
      )?.id,
    [activeWalletId, embeddedWalletsData?.wallets, evmAddress],
  );
  const miniAppEvmWalletId = useMemo(
    () =>
      miniAppActiveWalletId ??
      embeddedWalletsData?.wallets.find(
        (wallet) =>
          wallet.protocol === 'ethereum' &&
          wallet.address.toLowerCase() ===
            resolvedMiniAppEvmAddress?.toLowerCase(),
      )?.id,
    [
      embeddedWalletsData?.wallets,
      miniAppActiveWalletId,
      resolvedMiniAppEvmAddress,
    ],
  );
  const getNextPreviewRequestId = useCallback(() => {
    previewRequestIdRef.current += 1;
    return String(previewRequestIdRef.current);
  }, []);

  const executeTransactionCall = useCallback(
    async (
      call: Call,
      nonce: number,
      chainId: Hex,
      batchId: `0x${string}`,
      callIndex: number,
      request: RpcSchema.ExtractRequest<RpcSchema.Default, 'wallet_sendCalls'>,
      isSingleThreaded: boolean = false,
      walletContext: {
        address?: Hex;
        provider: EvmWalletProvider;
        walletId?: string;
      } = {
        address: evmAddress,
        provider: evmProvider,
        walletId: evmWalletId,
      },
    ) => {
      if (call.value && !isHex(call.value)) {
        throw new Error('Invalid value');
      }
      if (call.data && !isHex(call.data)) {
        throw new Error('Invalid data');
      }

      if (!isHex(chainId)) {
        throw new Error('Invalid chainId');
      }

      const batchStorage = batchCallsStorageRef.current.get(batchId);
      if (!batchStorage) {
        throw new Error('Batch storage not found');
      }

      const transactionResult: TransactionCallResult = {
        txHash: null,
        error: null,
        receipt: null,
      };
      batchStorage.results.set(callIndex, transactionResult);

      const nonceHex = toHex(nonce);
      const connectionContext = await getConnectionContext();

      // Submit transaction with retry logic for single-threaded execution
      const maxRetries = isSingleThreaded ? 3 : 1;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const tx = await walletContext.provider.request({
            method: 'eth_sendTransaction',
            params: [
              {
                to: call.to,
                value: call.value as Hex,
                data: call.data as Hex,
                nonce: nonceHex,
                chainId: chainId as Hex,
              },
            ],
          });
          transactionResult.txHash = tx;
          lastError = null;
          break; // Success, exit retry loop
        } catch (e) {
          lastError = e instanceof Error ? e : new Error('Unknown error');

          // Only retry if single-threaded and not the last attempt
          if (isSingleThreaded && attempt < maxRetries - 1) {
            logInDevOnly(
              `⚠️ Transaction failed (attempt ${attempt + 1}/${maxRetries}), retrying in 1s:`,
              lastError.message,
            );
            await sleep(1000); // Wait 1 second before retry
            continue;
          }

          transactionResult.error = lastError.message;
          return;
        }
      }

      try {
        await recordWalletTransaction({
          params: {
            walletId: walletContext.walletId,
            ethAddress: walletContext.address,
            ethTxHash: transactionResult.txHash!,
            ethChainId: parseInt(chainId, 16),
            attributedDomain: connectionContext?.domain,
            provider: 'warpcast',
            metadata: {
              type: 'evm-send-calls',
              callId: batchId,
              txIdx: callIndex,
              request: parseSendCalls(
                request,
                parseInt(chainId, 16),
                walletContext.address,
              ),
            },
          },
        });
      } catch (e) {
        logErrorInDevOnly('Failed to record wallet transaction', e);
      }

      // Poll for receipt (up to 10 seconds)
      const maxAttempts = 50; // 50 attempts * 200ms = 10 seconds
      let attempts = 0;
      let receipt = null;

      while (attempts < maxAttempts && !receipt) {
        try {
          receipt = await walletContext.provider.request({
            method: 'eth_getTransactionReceipt',
            params: [transactionResult.txHash! as `0x${string}`],
          });
          if (!receipt) {
            await sleep(200);
            attempts++;
          }
        } catch (e) {
          // Continue polling
          await sleep(200);
          attempts++;
        }
      }

      if (!receipt) {
        transactionResult.error = 'Transaction timed out';
        return;
      }

      transactionResult.receipt = CallReceiptSchema.parse({
        logs: receipt.logs,
        status: receipt.status,
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        transactionHash: receipt.transactionHash,
      });
    },
    [
      evmProvider,
      getConnectionContext,
      recordWalletTransaction,
      evmAddress,
      evmWalletId,
    ],
  );

  /**
   * WARNING - SENSITIVE CODE
   *
   * This provider will receive untrusted requests from 3rd party applications
   * and must present a preview to the user that must be approved before
   * forwarding the request to the wallet. Take care when modifying.
   */
  const previewEvmProvider = useMemo(
    (): EvmWalletProvider => ({
      on: miniAppEvmProvider.on.bind(miniAppEvmProvider),
      removeListener:
        miniAppEvmProvider.removeListener.bind(miniAppEvmProvider),
      async request(request) {
        // Consume any surface-provided context synchronously at the top of the
        // handler (before any await) so a concurrent dispatch from another
        // surface can't clobber it, then stamp it onto the preview below.
        const dispatchConnectionContext = pendingConnectionContextRef.current;
        pendingConnectionContextRef.current = undefined;
        switch (request.method) {
          case 'wallet_sendCalls': {
            logInDevOnly(
              '🙂 Called wallet_sendCalls',
              JSON.stringify(request, null, 2),
            );
            // Parse and validate params
            const validatedBatchParams = WalletSendCallsParamsSchema.safeParse(
              request.params,
            );
            if (!validatedBatchParams.success) {
              throw new Provider.ProviderRpcError(
                -32602, // Standard RPC error code for invalid params
                validatedBatchParams.error.message,
              );
            }

            const [params] = validatedBatchParams.data;

            // Ensure atomicRequired is false (we don't support atomic batch execution)
            if (params.atomicRequired) {
              throw new Provider.ProviderRpcError(
                4200, // Unsupported Method per EIP-5792
                'Atomic batch execution is not supported',
              );
            }

            // Get current chain and ensure it matches the params
            const currentChainId = await miniAppEvmProvider.request({
              method: 'eth_chainId',
            });

            if (currentChainId !== params.chainId) {
              throw new Provider.ProviderRpcError(
                -32602,
                `Chain mismatch: current chain ${currentChainId}, requested ${params.chainId}`,
              );
            }

            // Ensure capabilities are all optional (or not present)
            if (params.capabilities) {
              for (const [key, capability] of Object.entries(
                params.capabilities,
              )) {
                // We do not support any non-optional capabilities
                const isUnsupported = capability.optional === false;
                if (isUnsupported) {
                  throw new Provider.ProviderRpcError(
                    -32601,
                    `Non-optional capability "${key}" is not supported`,
                  );
                }
              }
            }

            // Also check capabilities in individual calls
            for (const call of params.calls) {
              if (call.capabilities) {
                for (const [key, capability] of Object.entries(
                  call.capabilities,
                )) {
                  const isUnsupported = capability.optional === false;
                  if (isUnsupported) {
                    throw new Provider.ProviderRpcError(
                      -32601,
                      `Non-optional capability "${key}" in call is not supported`,
                    );
                  }
                }
              }
            }

            // Generate or use existing ID
            const batchId =
              params.id ||
              `0x${crypto.getRandomValues(new Uint8Array(32)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`;

            // Check if ID has been seen before
            if (processedBatchIds.current.has(batchId)) {
              throw new Provider.ProviderRpcError(
                -32000, // General server error
                'Duplicate batch ID',
              );
            }

            // Determine execution mode based on approval patterns
            const isSingleThreaded = shouldUseSequentialExecution(params.calls);

            return new Promise((resolve, reject) => {
              const thisRequest: PreviewRequest = (() => {
                let approved = false; // guard against double approval
                let cancelled = false;
                let settled = false;

                if (!resolvedMiniAppEvmAddress) {
                  throw new Error('[EmbeddedWallet] No address');
                }
                processedBatchIds.current.add(batchId);

                const typedRequest = request as RpcSchema.ExtractRequest<
                  RpcSchema.Default,
                  'wallet_sendCalls'
                >;
                const removePreviewRequest = () => {
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== thisRequest),
                  );
                };
                const cleanupUnsettledBatch = () => {
                  batchCallsStorageRef.current.delete(batchId);
                  processedBatchIds.current.delete(batchId);
                };
                return {
                  id: getNextPreviewRequestId(),
                  protocol: 'evm' as const,
                  connectionContext: dispatchConnectionContext,
                  evmPreviewRequest: {
                    request: typedRequest,
                    approve: async () => {
                      logInDevOnly('🙂 APPROVED 🎉! ' + batchId);
                      if (approved) {
                        logInDevOnly('double approval');
                        return;
                      }

                      approved = true;
                      try {
                        // TODO: Record transactions for each successful call
                        batchCallsStorageRef.current.set(batchId, {
                          request: validatedBatchParams.data,
                          results: new Map(),
                        });

                        const currentNonceHex =
                          await miniAppEvmProvider.request({
                            method: 'eth_getTransactionCount',
                            params: [resolvedMiniAppEvmAddress, 'pending'],
                          });
                        const currentNonce = parseInt(currentNonceHex, 16);

                        if (cancelled || settled) {
                          return;
                        }

                        // Immediately resolve with the batch ID
                        const response: WalletSendCallsResponse = {
                          id: batchId,
                          capabilities: {}, // No capabilities supported
                        };
                        settled = true;
                        resolve(response as never);
                        removePreviewRequest();

                        void (async () => {
                          let callIndex = 0;
                          const transactionPromises = [];
                          for (const call of validatedBatchParams.data[0]
                            .calls) {
                            const newNonce = currentNonce + callIndex;
                            const txExecutionPromise = executeTransactionCall(
                              call,
                              newNonce,
                              params.chainId as Hex,
                              batchId as `0x${string}`,
                              callIndex,
                              typedRequest,
                              isSingleThreaded,
                              {
                                address: resolvedMiniAppEvmAddress,
                                provider: miniAppEvmProvider,
                                walletId: miniAppEvmWalletId,
                              },
                            );

                            transactionPromises.push(txExecutionPromise);

                            // For single-threaded execution, wait for each transaction to complete
                            if (isSingleThreaded) {
                              await txExecutionPromise;
                            }

                            callIndex++;
                          }

                          // Wait for all transactions to complete if parallel execution
                          if (!isSingleThreaded) {
                            await Promise.all(transactionPromises);
                          }
                        })().catch((e) => {
                          logErrorInDevOnly(e);
                        });
                      } catch (err) {
                        if (!settled) {
                          cleanupUnsettledBatch();
                          settled = true;
                          reject(err);
                          removePreviewRequest();
                        }
                        throw err;
                      } finally {
                        if (!settled) {
                          cleanupUnsettledBatch();
                          removePreviewRequest();
                        }
                      }
                    },
                    reject: () => {
                      if (settled) {
                        return;
                      }
                      cancelled = true;
                      cleanupUnsettledBatch();
                      settled = true;
                      reject(new Provider.UserRejectedRequestError());
                      removePreviewRequest();
                    },
                  },
                };
              })();

              setPreviewRequests((current) => [...current, thisRequest]);
            });
          }
          case 'wallet_getCallsStatus': {
            const params = request.params as [string] | undefined;
            if (!params || !params[0] || !isHex(params[0])) {
              throw new Provider.ProviderRpcError(-32602, 'Invalid call ID');
            }

            const batchId = params[0] as `0x${string}`;
            const batchStorage = batchCallsStorageRef.current.get(batchId);

            if (!batchStorage) {
              throw new Provider.ProviderRpcError(-32602, 'Unknown batch ID');
            }

            // Get chain ID from the stored request
            const chainId = batchStorage.request[0].chainId;

            // Collect all results and determine overall status
            const receipts: CallReceipt[] = [];
            let hasAnyPendingCalls = false;
            let hasAnyFailedCalls = false;
            let hasAnySuccessfulCalls = false;

            for (const [, result] of batchStorage.results) {
              if (result.receipt) {
                receipts.push(result.receipt);
                if (result.receipt.status === '0x1') {
                  hasAnySuccessfulCalls = true;
                } else {
                  hasAnyFailedCalls = true;
                }
              } else if (result.error) {
                hasAnyFailedCalls = true;
              } else {
                hasAnyPendingCalls = true;
              }
            }

            // Determine overall batch status
            let status: number;
            if (hasAnyPendingCalls) {
              status = 100; // Batch has been received but not completed
            } else if (hasAnySuccessfulCalls && !hasAnyFailedCalls) {
              status = 200; // All calls succeeded
            } else if (!hasAnySuccessfulCalls && hasAnyFailedCalls) {
              status = 500; // All calls failed
            } else {
              status = 600; // Partial success/failure
            }

            const response: WalletGetCallsStatusResponse = {
              version: '1.0',
              chainId,
              id: batchId,
              status,
              atomic: false, // We don't support atomic execution
              receipts,
              capabilities: {}, // No capabilities supported
            };

            return response as never;
          }
          case 'wallet_getCapabilities': {
            // TODO: Support additional parameter (chains)
            const parsedParams = GetCapabilitiesSingleSchema.safeParse(
              request.params,
            );
            if (!parsedParams.success) {
              throw new Provider.ProviderRpcError(
                -32602, // Standard RPC error code for invalid params
                parsedParams.error.message,
              );
            }
            const [address] = parsedParams.data;

            if (
              !resolvedMiniAppEvmAddress ||
              resolvedMiniAppEvmAddress.toLowerCase() !== address.toLowerCase()
            ) {
              throw new Provider.ProviderRpcError(4100, 'Unauthorized');
            }

            // No capabilities supported, so return empty object per EIP-5792
            return {} as never;
          }
          // I don't support any of this, please update my code
          case 'eth_requestAccounts': {
            return new Promise((resolve, reject) => {
              const thisRequest = (() => {
                let approved = false; // guard against double approval

                return {
                  id: getNextPreviewRequestId(),
                  protocol: 'evm' as const,
                  evmPreviewRequest: {
                    request: request as RpcSchema.ExtractRequest<
                      RpcSchema.Default,
                      'eth_requestAccounts'
                    >,
                    approve: async (address: string) => {
                      if (approved) {
                        logInDevOnly('double approval');
                        return;
                      }

                      approved = true;
                      resolve([address] as never);
                      setPreviewRequests((reqs) =>
                        reqs.filter((req) => req !== thisRequest),
                      );
                    },
                    reject: () => {
                      reject(new Provider.UserRejectedRequestError());
                      setPreviewRequests((reqs) =>
                        reqs.filter((req) => req !== thisRequest),
                      );
                    },
                  },
                };
              })();

              setPreviewRequests((current) => [...current, thisRequest]);
            });
          }
          case 'personal_sign':
          case 'eth_sendTransaction':
          case 'eth_signTypedData_v4':
            return new Promise((resolve, reject) => {
              const thisRequest = (() => {
                let approved = false; // guard against double approval

                if (!resolvedMiniAppEvmAddress) {
                  throw new Error('[EmbeddedWallet] No address');
                }

                return {
                  id: getNextPreviewRequestId(),
                  protocol: 'evm' as const,
                  connectionContext: dispatchConnectionContext,
                  evmPreviewRequest: {
                    request: request as RpcSchema.ExtractRequest<
                      RpcSchema.Default,
                      | 'personal_sign'
                      | 'eth_sendTransaction'
                      | 'eth_signTypedData_v4'
                    >,
                    approve: async () => {
                      if (approved) {
                        logInDevOnly('double approval');
                        return;
                      }

                      approved = true;
                      try {
                        const chainId = await miniAppEvmProvider.request({
                          method: 'eth_chainId',
                        });

                        const apiChain = chainId
                          ? chainIdToChain(parseInt(chainId, 16).toString())
                          : undefined;
                        const viemChain = apiChain
                          ? apiChainToViemChainOrThrow(apiChain)
                          : undefined;

                        const chain = chainId ? viemChain : undefined;

                        const result = await miniAppEvmProvider.request({
                          method: request.method,
                          params: request.params,
                        } as never);

                        (async () => {
                          if (request.method !== 'eth_sendTransaction') {
                            return;
                          }

                          if (!apiChain || !chain) {
                            logErrorInDevOnly(
                              new Error('[EmbeddedWallet] No chain'),
                            );
                            return;
                          }

                          addPendingTransaction({
                            chain: apiChain,
                            txHash: result as Hex,
                            metadata: {
                              type: 'misc',
                              connectionContext: undefined,
                            },
                          });

                          await sleep(200);

                          const publicClient = getEthereumClient({ chain });

                          try {
                            const receipt =
                              await publicClient.waitForTransactionReceipt({
                                hash: result as Hex,
                              });
                            removePendingTransaction(result as Hex);

                            const requestFingerprint = JSON.stringify(request);
                            const scanResults =
                              scanResultsMapRef.current.get(requestFingerprint);
                            if (!scanResults) {
                              throw new Error(
                                "couldn't get scanResults for EVM transaction",
                              );
                            }

                            if (
                              receipt?.status !== 'success' ||
                              !isEvmScanAction(scanResults.action)
                            ) {
                              return;
                            }

                            const connectionContext =
                              dispatchConnectionContext ??
                              (await getConnectionContext());

                            const evmScanAction = scanResults.action;
                            await recordWalletTransaction({
                              params: {
                                walletId: miniAppEvmWalletId,
                                ethAddress: resolvedMiniAppEvmAddress as string,
                                ethChainId:
                                  evmScanAction.method === 'eth_sendTransaction'
                                    ? Number(evmScanAction.params.chainId)
                                    : evmScanAction.chainId,
                                ethTxHash: result as Hex,
                                attributedDomain: connectionContext?.domain,
                                provider: 'warpcast',
                                metadata: {
                                  type: 'request',
                                  request: scanResults.action,
                                  stateChanges:
                                    scanResults.scanResponse.stateChanges || [],
                                },
                              },
                            });

                            // Clean up scan results after recording
                            scanResultsMapRef.current.delete(
                              requestFingerprint,
                            );
                          } catch (e) {
                            logErrorInDevOnly(e);
                          }
                        })();

                        resolve(result as never);
                      } catch (err) {
                        // If anything inside approve throws — typically the
                        // underlying wallet provider failing during chain
                        // lookup or the actual broadcast — reject the outer
                        // preview Promise with the *actual* error. If we
                        // don't, the Promise hangs until something else
                        // (the WalletActionEthSendTransaction onDismiss
                        // race or its onConfirm catch) calls
                        // `request.reject()`, which substitutes a synthetic
                        // UserRejectedRequestError (code 4001). dApps then
                        // surface "user cancelled" for what was actually an
                        // internal wallet failure — exactly the symptom we
                        // see when a Privy / keychain / RPC error fires
                        // mid-confirm. Re-throw so the UI's catch path is
                        // unchanged.
                        reject(err);
                        throw err;
                      } finally {
                        setPreviewRequests((reqs) =>
                          reqs.filter((req) => req !== thisRequest),
                        );
                      }
                    },
                    reject: () => {
                      reject(new Provider.UserRejectedRequestError());
                      setPreviewRequests((reqs) =>
                        reqs.filter((req) => req !== thisRequest),
                      );
                    },
                  },
                };
              })();

              setPreviewRequests((current) => [...current, thisRequest]);
            });
          case 'eth_accounts':
            if (!resolvedMiniAppEvmAddress) {
              return [] as never;
            }
            return miniAppEvmProvider.request(request as never);
          case 'eth_blockNumber':
          case 'eth_chainId':
          case 'eth_gasPrice':
          case 'eth_getBalance':
          case 'eth_getBlockByNumber':
          case 'eth_getCode':
          case 'eth_getTransactionByHash':
          case 'wallet_addEthereumChain':
          case 'wallet_switchEthereumChain':
            return miniAppEvmProvider.request(request as never);
          default:
            throw new Provider.UnsupportedMethodError({
              message: `Farcaster Wallet does not support the requested method: ${request.method}`,
            });
        }
      },
    }),
    [
      resolvedMiniAppEvmAddress,
      miniAppEvmProvider,
      getEthereumClient,
      addPendingTransaction,
      removePendingTransaction,
      recordWalletTransaction,
      getConnectionContext,
      executeTransactionCall,
      getNextPreviewRequestId,
      miniAppEvmWalletId,
    ],
  );

  const solanaProviderRequest = miniAppSolanaProvider.request;

  /**
   * WARNING - SENSITIVE CODE
   *
   * This provider will receive untrusted requests from 3rd party applications
   * and must present a preview to the user that must be approved before
   * forwarding the request to the wallet. Take care when modifying.
   */
  const previewSolanaProvider = useMemo((): SolanaWalletProviderWithConn => {
    const requestFn = async <T extends SolanaCombinedTransaction>(
      request:
        | SolanaConnectRequestArguments
        | SolanaSignMessageRequestArguments
        | SolanaSignAndSendTransactionRequestWithConnArguments
        | SolanaSignTransactionRequestArguments<T>,
    ) => {
      // Consume any surface-provided context synchronously (see the EVM
      // provider) so the preview carries its originating surface's context.
      const dispatchConnectionContext = pendingConnectionContextRef.current;
      pendingConnectionContextRef.current = undefined;
      if (request.method === 'connect') {
        if (!resolvedMiniAppSolanaAddress) {
          throw new Error('[EmbeddedWallet] No address');
        }
        if (isConnected) {
          return await solanaProviderRequest(request);
        }
        return new Promise((resolve, reject) => {
          const thisRequest = (() => {
            let approved = false; // guard against double approval

            return {
              id: getNextPreviewRequestId(),
              protocol: 'solana' as const,
              solanaPreviewRequest: {
                method: 'connect' as const,
                approve: async () => {
                  if (approved) {
                    logInDevOnly('double approval');
                    return;
                  }
                  approved = true;

                  const result = await solanaProviderRequest(request);

                  resolve(result);
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== thisRequest),
                  );
                },
                reject: () => {
                  reject(new Provider.UserRejectedRequestError());
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== thisRequest),
                  );
                },
              },
            };
          })();
          setPreviewRequests((current) => {
            const [first, ...rest] = current;
            if (!first) {
              return [thisRequest];
            } else if (
              first.protocol !== 'solana' ||
              first.solanaPreviewRequest.method !== 'connect'
            ) {
              return [...current, thisRequest];
            }
            const combinedRequest = {
              ...first,
              solanaPreviewRequest: {
                ...first.solanaPreviewRequest,
                approve: async () => {
                  first.solanaPreviewRequest.approve();
                  thisRequest.solanaPreviewRequest.approve();
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== combinedRequest),
                  );
                },
                reject: () => {
                  first.solanaPreviewRequest.reject();
                  thisRequest.solanaPreviewRequest.reject();
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== combinedRequest),
                  );
                },
              },
            };
            return [combinedRequest, ...rest];
          });
        });
      } else if (request.method === 'signMessage') {
        return new Promise((resolve, reject) => {
          const thisRequest = (() => {
            let approved = false; // guard against double approval

            if (!resolvedMiniAppSolanaAddress) {
              throw new Error('[EmbeddedWallet] No address');
            }

            return {
              id: getNextPreviewRequestId(),
              protocol: 'solana' as const,
              solanaPreviewRequest: {
                method: 'signMessage' as const,
                params: request.params,
                solanaAddress: resolvedMiniAppSolanaAddress,
                approve: async () => {
                  if (approved) {
                    logInDevOnly('double approval');
                    return;
                  }
                  approved = true;

                  const result = await solanaProviderRequest(request);

                  resolve(result);
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== thisRequest),
                  );
                },
                reject: () => {
                  reject(new Provider.UserRejectedRequestError());
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== thisRequest),
                  );
                },
              },
            };
          })();
          setPreviewRequests((current) => [...current, thisRequest]);
        });
      } else if (request.method === 'signAndSendTransaction') {
        return new Promise((resolve, reject) => {
          const thisRequest = (() => {
            let approved = false; // guard against double approval

            if (!resolvedMiniAppSolanaAddress) {
              throw new Error('[EmbeddedWallet] No address');
            }

            return {
              id: getNextPreviewRequestId(),
              protocol: 'solana' as const,
              connectionContext: dispatchConnectionContext,
              solanaPreviewRequest: {
                method: 'signAndSendTransaction' as const,
                params: request.params,
                solanaAddress: resolvedMiniAppSolanaAddress,
                approve: async () => {
                  if (approved) {
                    logInDevOnly('double approval');
                    return;
                  }
                  approved = true;

                  const result = await solanaProviderRequest(request);

                  const { signature } = result;

                  (async () => {
                    addPendingTransaction({
                      chain: 'solana',
                      txHash: signature,
                      metadata: {
                        type: 'misc',
                        connectionContext: undefined,
                      },
                    });

                    await sleep(200);

                    try {
                      const confirmation = await waitForSolanaTransaction({
                        signature,
                        waitingFor: 'processed',
                      });
                      removePendingTransaction(signature);

                      if (
                        confirmation.status !== 'processed' &&
                        confirmation.status !== 'confirmed' &&
                        confirmation.status !== 'finalized'
                      ) {
                        return;
                      }

                      const connectionContext =
                        dispatchConnectionContext ??
                        (await getConnectionContext());

                      const scanResults = scanResultsMapRef.current.get(
                        request.params.transaction,
                      );
                      if (!scanResults) {
                        throw new Error(
                          "couldn't get scanResults for Solana transaction",
                        );
                      }
                      const { action, scanResponse } = scanResults;

                      await recordWalletTransaction({
                        params: {
                          solAddress: resolvedMiniAppSolanaAddress,
                          solTxHash: signature,
                          attributedDomain: connectionContext?.domain,
                          provider: 'warpcast',
                          metadata: {
                            type: 'request',
                            request: action,
                            stateChanges: scanResponse.stateChanges || [],
                          },
                        },
                      });

                      scanResultsMapRef.current.delete(
                        request.params.transaction,
                      );
                    } catch (e) {
                      logErrorInDevOnly(e);
                    }
                  })();

                  resolve(result);
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== thisRequest),
                  );
                },
                reject: () => {
                  reject(new Provider.UserRejectedRequestError());
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== thisRequest),
                  );
                },
              },
            };
          })();
          setPreviewRequests((current) => [...current, thisRequest]);
        });
      } else if (request.method === 'signTransaction') {
        return new Promise((resolve, reject) => {
          const thisRequest = (() => {
            let approved = false; // guard against double approval

            if (!resolvedMiniAppSolanaAddress) {
              throw new Error('[EmbeddedWallet] No address');
            }

            return {
              id: getNextPreviewRequestId(),
              protocol: 'solana' as const,
              connectionContext: dispatchConnectionContext,
              solanaPreviewRequest: {
                method: 'signTransaction' as const,
                params: request.params,
                solanaAddress: resolvedMiniAppSolanaAddress,
                approve: async () => {
                  if (approved) {
                    logInDevOnly('double approval');
                    return;
                  }
                  approved = true;

                  const result = await solanaProviderRequest(request);

                  resolve(result);
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== thisRequest),
                  );
                },
                reject: () => {
                  reject(new Provider.UserRejectedRequestError());
                  setPreviewRequests((reqs) =>
                    reqs.filter((req) => req !== thisRequest),
                  );
                },
              },
            };
          })();
          setPreviewRequests((current) => [...current, thisRequest]);
        });
      }
    };
    return createSolanaWalletProviderWithConn(
      requestFn as SolanaRequestFnWithConn,
    );
  }, [
    solanaProviderRequest,
    resolvedMiniAppSolanaAddress,
    addPendingTransaction,
    removePendingTransaction,
    getConnectionContext,
    recordWalletTransaction,
    isConnected,
    getNextPreviewRequestId,
  ]);

  const previewRequest = previewRequests[0];

  const clearPreviewRequests = React.useCallback(() => {
    // Reject all pending requests with UserRejectedRequestError
    previewRequests.forEach((request) => {
      if (request.protocol === 'evm') {
        request.evmPreviewRequest.reject();
      } else if (request.protocol === 'solana') {
        request.solanaPreviewRequest.reject();
      }
    });

    // Clear the preview requests array
    setPreviewRequests([]);
  }, [previewRequests]);

  const contextValue = React.useMemo(
    () => ({
      ...forwarded,
      ...pendingTransactions,
      previewRequest,
      scanResultsMap: scanResultsMapRef.current,
      transactionCounterRef,
      pendingConnectionContextRef,
      clearPreviewRequests,
      evmMiniAppProvider: previewEvmProvider,
      solanaMiniAppProvider: previewSolanaProvider,
      solanaWalletProvider: solanaProvider,
    }),
    [
      forwarded,
      pendingTransactions,
      previewRequest,
      previewEvmProvider,
      previewSolanaProvider,
      solanaProvider,
      clearPreviewRequests,
    ],
  );

  return (
    <EmbeddedWalletContext.Provider value={contextValue}>
      <WalletTransactionsProvider>{children}</WalletTransactionsProvider>
    </EmbeddedWalletContext.Provider>
  );
}
export const useEmbeddedWallet = () => {
  const context = useContext(EmbeddedWalletContext);
  if (context === undefined) {
    throw new Error(
      'useEmbeddedWallet must be used within a EmbeddedWalletProvider',
    );
  }
  return context;
};
