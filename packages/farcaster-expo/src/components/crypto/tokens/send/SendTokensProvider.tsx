import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToViemChainOrThrow,
  ApiEthFungibleTokenPosition,
  ApiEthNonFungibleToken,
  ApiPlatformType,
  ApiWalletSendTarget,
  ApiWalletSendTransactionMetadata,
  chainIdToChainOrThrow,
  extractWalletChain,
  RELAY_SOLANA_CHAIN_ID,
  WalletChainId,
} from 'farcaster-client-data';
import {
  useFetchPrimaryAddress,
  useFetchUser,
  useInvalidateWalletSendSuggestions,
  useRecordWalletTransaction,
} from 'farcaster-client-hooks';
import React, {
  createContext,
  MutableRefObject,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Chain,
  encodeFunctionData,
  erc20Abi,
  erc721Abi,
  Hex,
  parseAbi,
} from 'viem';

import { useEmbeddedWallet, useSharedTelemetry } from '../../../../contexts';
import { useWalletTransactions } from '../../../../contexts/WalletTransactionsProvider';
import { useWalletBalances } from '../../../../hooks/useWalletBalances';
import { useWalletRefresh } from '../../../../hooks/useWalletRefresh';
import { GetWalletClient, WalletSendIntent } from '../../../../types';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  isNativeAsset,
  solanaConnection,
} from '../../../../utils';
import { getComputeUnitInstructions } from '../../../../utils/SolanaUtils';

export type TransactionState =
  | 'pending'
  | 'succeeded'
  | 'reverted'
  | 'error-sending'
  | 'error-monitoring';

export type SendTransactionOptions = {
  sendQuantity: bigint;
  sendToken: ApiEthFungibleTokenPosition | ApiEthNonFungibleToken;
  sendTarget: ApiWalletSendTarget;
  sendNote?: string;
};

export type EthTransactionData = {
  protocol: 'ethereum';
  to: Hex;
  chain: Chain;
  data?: Hex;
  value?: bigint;
  metadata: ApiWalletSendTransactionMetadata;
  decimals?: number;
};

export type SolanaTransactionData = {
  protocol: 'solana';
  token: string;
  symbol?: string;
  metadata: ApiWalletSendTransactionMetadata;
  decimals?: number;
};

type SendTokensContextType = {
  evmAddress: `0x${string}`;
  solanaAddress: string | undefined;
  getWalletClient: GetWalletClient;
  platformType: ApiPlatformType;
  onSuccess?: (hash: string) => void;
  onError?: (reason: string) => void;
  onSendExecuted?: () => void;
  sendIntent?: WalletSendIntent;

  // Transaction state
  transactionData?: EthTransactionData | SolanaTransactionData;
  txHash?: string;
  txState?: TransactionState;
  executeSend: () => Promise<void>;

  // Form fields
  sendToken: ApiEthFungibleTokenPosition | ApiEthNonFungibleToken | undefined;
  setSendToken: (
    token: ApiEthFungibleTokenPosition | ApiEthNonFungibleToken | undefined,
  ) => void;
  sendQuantity: bigint | undefined;
  setSendQuantity: (quantity: bigint | undefined) => void;
  sendTarget: ApiWalletSendTarget | undefined;
  setSendTarget: (target: ApiWalletSendTarget | undefined) => void;
  sendNote: string;
  setSendNote: (note: string) => void;
};

const SendTokensContext = createContext<SendTokensContextType | undefined>(
  undefined,
);

type SendTokensProviderProps = {
  origin?: string;
  attributedDomain?: string;
  platformType: ApiPlatformType;
  evmAddress: `0x${string}`;
  solanaAddress?: string;
  getWalletClient: GetWalletClient;
  transactionCounterRef: MutableRefObject<number>;
  children: ReactNode;
  onSuccess?: (hash: string) => void;
  onError?: (reason: string) => void;
  onSendExecuted?: () => void;
  sendIntent?: WalletSendIntent;
};

export function SendTokensProvider({
  origin,
  attributedDomain,
  platformType,
  evmAddress,
  solanaAddress,
  getWalletClient,
  transactionCounterRef,
  children,
  onSuccess,
  onError,
  onSendExecuted,
  sendIntent,
}: SendTokensProviderProps) {
  const [sendToken, setSendToken] = useState<
    ApiEthFungibleTokenPosition | ApiEthNonFungibleToken | undefined
  >(sendIntent?.token);
  const [sendQuantity, setSendQuantity] = useState<bigint>();
  const [sendTarget, setSendTarget] = useState<ApiWalletSendTarget | undefined>(
    sendIntent?.recipientAddress
      ? sendIntent?.recipientUser
        ? {
            type: 'user' as const,
            user: sendIntent.recipientUser,
            address: sendIntent.recipientAddress,
          }
        : {
            type: 'address' as const,
            address: sendIntent.recipientAddress,
          }
      : undefined,
  );
  const [sendNote, setSendNote] = useState<string>('');

  const [txHash, setTxHash] = useState<string>();
  const [txState, setTxState] = useState<TransactionState>();
  const { trackEvent, trackError } = useSharedTelemetry();

  const { addPendingTransaction, removePendingTransaction, activeWalletId } =
    useEmbeddedWallet();
  const recordWalletTransaction = useRecordWalletTransaction();
  const { submitTransaction } = useWalletTransactions();
  const invalidateWalletSendSuggestions = useInvalidateWalletSendSuggestions();

  const refreshWallet = useWalletRefresh();

  useResolveSendIntent({
    sendIntent,
    setSendToken,
    setSendTarget,
  });

  useEffect(() => {
    if (!sendToken || !sendTarget) {
      return;
    }

    const sendTokenChain =
      'interface' in sendToken
        ? chainIdToChainOrThrow(sendToken.chainId?.toString() ?? '')
        : sendToken.chain;

    if (
      sendTokenChain === 'solana' &&
      sendIntent?.recipientSolanaAddress &&
      sendTarget.address !== sendIntent.recipientSolanaAddress
    ) {
      setSendTarget({
        ...sendTarget,
        address: sendIntent.recipientSolanaAddress,
      });
    } else if (
      sendTokenChain !== 'solana' &&
      sendIntent?.recipientAddress &&
      sendTarget.address !== sendIntent.recipientAddress
    ) {
      setSendTarget({
        ...sendTarget,
        address: sendIntent.recipientAddress,
      });
    }
  }, [sendToken, sendIntent, sendTarget, setSendTarget]);

  const transactionData = useMemo(() => {
    if (!sendToken || !sendTarget?.address || !sendQuantity) {
      return undefined;
    }

    const target =
      sendTarget.type === 'user'
        ? {
            type: 'user' as const,
            fid: sendTarget.user.fid,
          }
        : {
            type: 'address' as const,
            address: sendTarget.address,
          };

    // ERC721 or ERC1155
    if ('interface' in sendToken) {
      if (!sendToken.chainId) {
        throw new Error('No chainId for token');
      }

      if (sendToken.chainId === RELAY_SOLANA_CHAIN_ID) {
        throw new Error('Solana collectibles are not supported yet');
      }

      const metadata: ApiWalletSendTransactionMetadata = {
        type: 'send',
        token: sendToken.contractAddress,
        amount: sendQuantity.toString(),
        target,
        note: sendNote || undefined,
      };

      const chain = extractWalletChain({
        id: sendToken.chainId as WalletChainId,
      });

      switch (sendToken.interface) {
        case 'ERC721': {
          const data = encodeFunctionData({
            abi: erc721Abi,
            functionName: 'safeTransferFrom',
            args: [
              evmAddress as `0x${string}`,
              sendTarget.address as `0x${string}`,
              BigInt(sendToken.tokenId),
            ],
          });

          return {
            protocol: 'ethereum' as const,
            chain,
            to: sendToken.contractAddress as `0x${string}`,
            data,
            metadata,
          };
        }
        case 'ERC1155': {
          const data = encodeFunctionData({
            abi: parseAbi([
              'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
            ]),
            functionName: 'safeTransferFrom',
            args: [
              evmAddress as `0x${string}`,
              sendTarget.address as `0x${string}`,
              BigInt(sendToken.tokenId),
              sendQuantity,
              '0x',
            ],
          });

          return {
            protocol: 'ethereum' as const,
            chain,
            to: sendToken.contractAddress as `0x${string}`,
            data,
            metadata,
          };
        }
      }

      // Native or ERC20 or SPL
    } else {
      if (!sendToken.chain) {
        throw new Error('No chain for token');
      }

      if (sendToken.chain === 'solana') {
        if (!solanaAddress) {
          throw new Error('No solana address');
        }

        const metadata: ApiWalletSendTransactionMetadata = {
          type: 'send',
          token: sendToken.address,
          amount: sendQuantity.toString(),
          target,
          note: sendNote || undefined,
        };
        return {
          protocol: 'solana' as const,
          token: sendToken.address,
          symbol: sendToken.symbol,
          decimals: sendToken.decimals ?? 9,
          metadata,
        } as SolanaTransactionData;
      } else {
        const chain = apiChainToViemChainOrThrow(sendToken.chain);

        const metadata: ApiWalletSendTransactionMetadata = {
          type: 'send',
          token: sendToken.address,
          amount: sendQuantity.toString(),
          target,
          note: sendNote,
        };

        if (isNativeAsset(sendToken.address)) {
          return {
            protocol: 'ethereum' as const,
            chain,
            to: sendTarget.address as `0x${string}`,
            value: sendQuantity,
            metadata,
          };
        } else {
          return {
            protocol: 'ethereum' as const,
            chain,
            to: sendToken.address as `0x${string}`,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'transfer',
              args: [sendTarget.address as `0x${string}`, sendQuantity],
            }),
            metadata,
            decimals: sendToken.decimals,
          };
        }
      }
    }
  }, [
    sendToken,
    sendTarget,
    sendQuantity,
    sendNote,
    evmAddress,
    solanaAddress,
  ]);

  const executeSend = useCallback(async () => {
    if (!transactionData) {
      trackError(new Error("Can't sendTransaction without transactionData"));
      return;
    }

    if (!sendQuantity) {
      throw new Error('No send quantity');
    }

    if (!sendTarget?.address) {
      throw new Error('No send target address');
    }

    const metadata = {
      ...transactionData.metadata,
      origin,
    } as ApiWalletSendTransactionMetadata;

    if (transactionData.protocol === 'ethereum') {
      const { chain, ...rest } = transactionData;

      const analyticsProperties = {
        chainId: chain.id,
        hasNote: !!metadata?.note,
      };

      setTxState('pending');
      onSendExecuted?.();

      const buildTransaction = async () => {
        return {
          ...rest,
          account: evmAddress,
          chain: chain,
        };
      };

      const handleProcessed = (txHash: string) => {
        onSuccess?.(txHash);
        addPendingTransaction({
          chain: chainIdToChainOrThrow(chain.id.toString()),
          txHash,
          metadata,
        });

        setTxHash(txHash);

        void recordWalletTransaction({
          params: {
            walletId: activeWalletId,
            ethAddress: evmAddress,
            ethChainId: chain.id,
            ethTxHash: txHash,
            provider: 'warpcast',
            metadata,
            attributedDomain,
          },
        });
      };

      const handleSuccess = (txHash: string) => {
        setTxState('succeeded');
        setTxHash(txHash);
        trackEvent(AnalyticsEvent.SendWalletTransactionSucceeded, {
          ...analyticsProperties,
        });

        transactionCounterRef.current += 1;
        removePendingTransaction(txHash);

        if (!(sendToken && 'interface' in sendToken)) {
          refreshWallet([
            {
              chain: chainIdToChainOrThrow(transactionData.chain.id.toString()),
              ca: transactionData.metadata?.token,
              decimals: transactionData.decimals,
            },
          ]);

          invalidateWalletSendSuggestions({
            protocol: 'ethereum',
          });
        }
      };

      const handleError = (error?: Error, txHash?: string) => {
        onError?.('send_failed');
        if (txHash) {
          removePendingTransaction(txHash);
        }
        if (error) {
          setTxState('error-monitoring');
          trackEvent(AnalyticsEvent.SendWalletTransactionError, {
            ...analyticsProperties,
            type: 'monitoring',
            error: error instanceof Error ? error.toString() : 'unknown',
          });
          trackError(
            new Error(
              `error monitoring wallet transaction ${txHash}: ${error.message}`,
              {
                cause: error,
              },
            ),
          );
        } else {
          setTxState('reverted');
          trackEvent(
            AnalyticsEvent.SendWalletTransactionReverted,
            analyticsProperties,
          );
        }
      };

      const args = {
        protocol: 'ethereum' as const,
        chain: chainIdToChainOrThrow(chain.id.toString()),
        buildTransaction,
        onProcessed: handleProcessed,
        onSuccess: handleSuccess,
        onError: handleError,
        metadata: {
          type: 'send' as const,
          token: sendToken as ApiEthFungibleTokenPosition,
          target: sendTarget,
          quantity: sendQuantity.toString(),
        },
      };

      submitTransaction(args);
    } else {
      if (!solanaAddress) {
        throw new Error('No solana address');
      }

      const analyticsProperties = {
        chainId: RELAY_SOLANA_CHAIN_ID,
        hasNote: !!transactionData?.metadata?.note,
      };

      setTxState('pending');
      onSendExecuted?.();

      const getTransactionData = async () => {
        if (!sendTarget?.address) {
          throw new Error('No send target address');
        }

        const transaction = new Transaction();

        if (isNativeAsset(transactionData.token)) {
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: new PublicKey(solanaAddress),
              toPubkey: new PublicKey(sendTarget.address),
              lamports: sendQuantity,
            }),
          );
        } else {
          const mint = new PublicKey(transactionData.token);

          // Detect which token program this mint belongs to
          const mintAccountInfo = await solanaConnection.getAccountInfo(mint);
          const tokenProgramId = mintAccountInfo?.owner?.equals(
            TOKEN_2022_PROGRAM_ID,
          )
            ? TOKEN_2022_PROGRAM_ID
            : TOKEN_PROGRAM_ID;

          const [fromTokenAccount, toTokenAccount] = await Promise.all([
            getAssociatedTokenAddress(
              mint,
              new PublicKey(solanaAddress),
              undefined,
              tokenProgramId,
            ),
            getAssociatedTokenAddress(
              mint,
              new PublicKey(sendTarget.address),
              undefined,
              tokenProgramId,
            ),
          ]);

          // Create the recipient's token account if it doesn't exist
          const toTokenAccountInfo =
            await solanaConnection.getAccountInfo(toTokenAccount);
          if (!toTokenAccountInfo) {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                new PublicKey(solanaAddress),
                toTokenAccount,
                new PublicKey(sendTarget.address),
                mint,
                tokenProgramId,
                ASSOCIATED_TOKEN_PROGRAM_ID,
              ),
            );
          }

          transaction.add(
            createTransferCheckedInstruction(
              fromTokenAccount,
              mint,
              toTokenAccount,
              new PublicKey(solanaAddress),
              sendQuantity,
              transactionData.decimals ?? 9,
              [],
              tokenProgramId,
            ),
          );
        }

        return transaction;
      };

      const buildTransaction = async () => {
        const [{ blockhash }, transaction] = await Promise.all([
          solanaConnection.getLatestBlockhash(),
          getTransactionData(),
        ]);

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new PublicKey(solanaAddress);

        const simulation =
          await solanaConnection.simulateTransaction(transaction);

        if (simulation.value.err) {
          throw new Error('Simulation failed');
        }

        transaction.add(
          ...getComputeUnitInstructions(simulation.value.unitsConsumed),
        );

        return transaction;
      };

      const handleProcessed = (txHash: string) => {
        onSuccess?.(txHash);
        recordWalletTransaction({
          params: {
            solAddress: solanaAddress,
            solTxHash: txHash,
            provider: 'warpcast',
            metadata,
            attributedDomain,
          },
        });
      };

      const handleSuccess = (txHash: string) => {
        setTxState('succeeded');
        setTxHash(txHash);
        trackEvent(AnalyticsEvent.SendWalletTransactionSucceeded, {
          ...analyticsProperties,
        });

        transactionCounterRef.current += 1;

        refreshWallet([
          {
            chain: 'solana',
            ca: transactionData.metadata?.token,
            decimals: transactionData.decimals,
          },
        ]);

        invalidateWalletSendSuggestions({
          protocol: 'solana',
        });
      };

      const handleError = (error?: Error, txHash?: string) => {
        onError?.('send_failed');
        if (error) {
          setTxState('error-monitoring');
          trackEvent(AnalyticsEvent.SendWalletTransactionError, {
            ...analyticsProperties,
            type: 'monitoring',
            error: error instanceof Error ? error.toString() : 'unknown',
          });
          trackError(
            new Error(
              `error monitoring wallet transaction ${txHash}: ${error.message}`,
              {
                cause: error,
              },
            ),
          );
        } else {
          setTxState('reverted');
          trackEvent(
            AnalyticsEvent.SendWalletTransactionReverted,
            analyticsProperties,
          );
        }
      };

      const args = {
        protocol: 'solana' as const,
        chain: 'solana' as const,
        buildTransaction,
        onProcessed: handleProcessed,
        onSuccess: handleSuccess,
        onError: handleError,
        metadata: {
          type: 'send' as const,
          token: sendToken as ApiEthFungibleTokenPosition,
          target: sendTarget,
          quantity: sendQuantity.toString(),
        },
      };

      submitTransaction(args);
    }
  }, [
    transactionData,
    addPendingTransaction,
    activeWalletId,
    recordWalletTransaction,
    refreshWallet,
    trackError,
    trackEvent,
    removePendingTransaction,
    origin,
    evmAddress,
    attributedDomain,
    transactionCounterRef,
    sendToken,
    solanaAddress,
    sendTarget,
    sendQuantity,
    submitTransaction,
    onSuccess,
    onError,
    onSendExecuted,
    invalidateWalletSendSuggestions,
  ]);

  const value = useMemo(() => {
    return {
      evmAddress,
      solanaAddress,
      getWalletClient,
      onSuccess,
      onError,
      onSendExecuted,
      transactionData,
      txHash,
      txState,
      executeSend,
      sendToken,
      setSendToken,
      sendQuantity,
      setSendQuantity,
      sendTarget,
      setSendTarget,
      sendNote,
      setSendNote,
      sendIntent,
      platformType,
    };
  }, [
    evmAddress,
    solanaAddress,
    getWalletClient,
    onSuccess,
    onError,
    onSendExecuted,
    transactionData,
    txHash,
    txState,
    executeSend,
    sendToken,
    sendQuantity,
    sendTarget,
    sendNote,
    sendIntent,
    platformType,
  ]);

  return (
    <SendTokensContext.Provider value={value}>
      {children}
    </SendTokensContext.Provider>
  );
}

export function useSendTokens() {
  const context = useContext(SendTokensContext);
  if (context === undefined) {
    throw new Error('useSendTokens must be used within a SendTokensProvider');
  }
  return context;
}

function useResolveSendIntent({
  sendIntent,
  setSendToken,
  setSendTarget,
}: {
  sendIntent?: WalletSendIntent;
  setSendToken: (
    token: ApiEthFungibleTokenPosition | ApiEthNonFungibleToken | undefined,
  ) => void;
  setSendTarget: (target: ApiWalletSendTarget | undefined) => void;
}) {
  const { balances, isPending } = useWalletBalances();
  const fetchUser = useFetchUser();
  const fetchPrimaryAddress = useFetchPrimaryAddress();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (sendIntent?.chain && sendIntent?.ca) {
      const token = balances.find(
        (position) =>
          (position.address ?? EIP7528_NATIVE_ASSET_ADDRESS).toLowerCase() ===
            sendIntent.ca?.toLowerCase() && position.chain === sendIntent.chain,
      );

      if (token) {
        setSendToken(token);
      }
    }
  }, [balances, sendIntent, setSendToken, isPending]);

  const resolveSendTarget = useCallback(
    async (fid: number) => {
      const [user, primaryAddress] = await Promise.all([
        fetchUser({ fid }),
        fetchPrimaryAddress({ fid }),
      ]);

      if (user && primaryAddress) {
        setSendTarget({
          type: 'user',
          user: 'result' in user ? user.result.user : user,
          address: primaryAddress.address,
        });
      }
    },
    [fetchPrimaryAddress, fetchUser, setSendTarget],
  );

  useEffect(() => {
    const fid = sendIntent?.recipientUser?.fid ?? sendIntent?.recipientFid;

    if (fid) {
      resolveSendTarget(fid);
    }
  }, [sendIntent, resolveSendTarget]);
}
