import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCastCollectibleAuction,
  ApiChain,
  apiChainToChainIdOrThrow,
  extractWalletChain,
  WalletChainId,
} from 'farcaster-client-data';
import {
  calculateMinBid,
  useFarcasterApiClient,
  useFetchBidTransactionData,
  useInvalidateCastCollectiblesIndex,
  useRecordWalletTransaction,
  useSwapTokensForGas,
} from 'farcaster-client-hooks';
import {
  executeQuoteAsync,
  useEmbeddedWallet,
  useHaptics,
  usePublicClient,
  useRootToast,
  useWalletRefresh,
  useWalletTransactions,
} from 'farcaster-expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BaseError,
  ContractFunctionRevertedError,
  decodeFunctionData,
  formatUnits,
  Hex,
  parseUnits,
  SignTypedDataParameters,
} from 'viem';
import { useBalance, useReadContract } from 'wagmi';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { logInDevOnly } from '~/utils/LogUtils';

import { collectibleCastsAuctionAbi } from './auctionAbi';
import { LocalBid } from './useCollectCast';

// Bid error types
export type BidErrorKey =
  | 'bid_too_low'
  | 'insufficient_eth_for_gas'
  | 'checking_balance'
  | 'insufficient_balance';

export type BidError = {
  key: BidErrorKey;
  message: string;
};

// Custom ABI for EIP2612 tokens that includes the nonces function
const eip2612Abi = [
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useCollectibleCastBid({
  cast,
  chain,
  auction,
  setLocalBid,
  forceUpdateAuction,
}: {
  cast: ApiCast;
  chain: ApiChain;
  auction: ApiCastCollectibleAuction | undefined; // separate so we can use a local value
  setLocalBid: (local: LocalBid | undefined) => void;
  forceUpdateAuction: () => Promise<void>;
}) {
  const { trackEvent } = useAnalytics();
  const chainId = Number(apiChainToChainIdOrThrow(chain));
  const user = useCurrentUser_UNSAFE();

  const { triggerSuccessNotificationAsync } = useHaptics();

  const { evmAddress, getWalletClient } = useEmbeddedWallet();
  const { getEthereumClient } = usePublicClient();
  const recordWalletTransaction = useRecordWalletTransaction();
  const { submitTransaction } = useWalletTransactions();
  const { addPendingTransaction, removePendingTransaction } =
    useEmbeddedWallet();
  const fetchBidTransactionData = useFetchBidTransactionData();
  const refreshWallet = useWalletRefresh();
  const { invalidateCastCollectiblesIndex } =
    useInvalidateCastCollectiblesIndex();
  const toast = useRootToast();

  const areBalanceQueriesEnabled = !!auction && !!evmAddress;

  // Check USDC balance
  const { data: balanceData, isFetching: isBalanceLoading } = useBalance({
    address: evmAddress as Hex,
    token: auction?.bidToken as `0x${string}`,
    chainId,
    query: {
      refetchInterval: 5000,
      enabled: areBalanceQueriesEnabled,
    },
  });

  // Check native ETH balance for gas
  const { data: ethBalanceData } = useBalance({
    address: evmAddress as Hex,
    chainId,
    query: {
      refetchInterval: 5000,
      enabled: areBalanceQueriesEnabled,
    },
  });

  const balanceFloat = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : undefined;

  const ethBalanceFloat = ethBalanceData
    ? parseFloat(formatUnits(ethBalanceData.value, ethBalanceData.decimals))
    : undefined;

  const needsGas = ethBalanceFloat !== undefined && ethBalanceFloat < 0.000005;

  const { apiClient } = useFarcasterApiClient();
  const { data: gaslessQuoteResponse } = useSwapTokensForGas({
    chainId,
    enabled: needsGas,
  });

  const { data: tokenName } = useReadContract({
    address: auction?.bidToken as Hex,
    abi: eip2612Abi,
    functionName: 'name',
    chainId,
    query: {
      enabled: !!auction,
    },
  });

  const { data: tokenVersion } = useReadContract({
    address: auction?.bidToken as Hex,
    abi: eip2612Abi,
    functionName: 'version',
    chainId,
    query: {
      enabled: !!auction,
    },
  });

  const { data: nonceData, refetch: refetchNonce } = useReadContract({
    address: auction?.bidToken as Hex,
    abi: eip2612Abi,
    functionName: 'nonces',
    args: [evmAddress as Hex],
    chainId,
    query: {
      enabled: !!evmAddress,
      refetchInterval: 5000,
      staleTime: 0,
    },
  });

  const nonceRef = useRef<bigint | null>(null);
  useEffect(() => {
    if (nonceData) {
      nonceRef.current = nonceData;
    }
  }, [nonceData]);

  const minBid = (() => {
    if (auction) {
      return calculateMinBid(auction);
    }

    return 0;
  })().toString();

  const [bidAmount, setBidAmount] = useState(minBid);

  // Update bid amount when min bid changes and is greater than current bid
  useEffect(() => {
    if (Number(minBid) > Number(bidAmount)) {
      setBidAmount(minBid);
    }
  }, [bidAmount, minBid]);

  // Store the last transaction request for error simulation
  const lastTransactionRequestRef = useRef<{
    account: Hex;
    to: Hex;
    value: bigint;
    data: Hex;
  } | null>(null);
  const bidSubmissionInFlightRef = useRef(false);

  // Function to calculate bid error for any amount
  const calculateBidError = useCallback(
    (amount: string): BidError | null => {
      const bidFloat = parseFloat(amount);
      const minBidFloat = parseFloat(minBid);

      if (isNaN(bidFloat) || bidFloat < minBidFloat) {
        return {
          key: 'bid_too_low',
          message: `Bid $${minBid.toLocaleString()} or more`,
        };
      }

      if (balanceFloat !== undefined && bidFloat > balanceFloat) {
        return {
          key: 'insufficient_balance',
          message: 'Insufficient balance',
        };
      }

      return null;
    },
    [minBid, balanceFloat],
  );

  // Precomputed bid error for the current bid amount
  const bidError = useMemo(
    () => calculateBidError(bidAmount),
    [calculateBidError, bidAmount],
  );

  const submitBid = useCallback(
    async (options: Partial<{ forceNonce: boolean }> = {}) => {
      if (!auction) {
        logInDevOnly('Unexpected: no auction available');
        return;
      }

      if (bidSubmissionInFlightRef.current && !options.forceNonce) {
        logInDevOnly('Bid submission already in flight');
        return;
      }

      const bidAmountWei = parseUnits(bidAmount, 6);

      const bid = {
        bidder: {
          fid: user.fid,
          username: user.username,
          displayName: user.displayName,
          pfp: user.pfp,
        },
        timestamp: Date.now(),
        amount: bidAmountWei.toString(),
        value: parseFloat(bidAmount),
        isViewer: true,
      };

      bidSubmissionInFlightRef.current = true;

      setLocalBid({
        state: 'pending',
        bid,
      });

      const start = Date.now();
      const viemChain = extractWalletChain({ id: chainId as WalletChainId });
      const buildTransaction = async () => {
        const walletClient = await getWalletClient(viemChain);

        if (needsGas && gaslessQuoteResponse?.quote.success) {
          const requestId = await executeQuoteAsync({
            quote: gaslessQuoteResponse.quote,
            chainId,
            apiClient,
            client: walletClient,
            applicationUsage: 'other',
          });
          if (requestId) {
            let confirmed = false;
            const tries = 0;
            do {
              try {
                const result = await apiClient.getGaslessStatus({
                  requestId,
                  chainId,
                });
                if (result.data.result?.status === 'confirmed') {
                  confirmed = true;
                  break;
                }
              } catch {
                // do nothing
              }
              await new Promise((resolve) => setTimeout(resolve, 500));
            } while (tries < 10);
            if (!confirmed) {
              throw new Error('Gasless swap failed');
            }
          }
        }

        const permitDeadline = BigInt(Math.floor(Date.now() / 1000) + 600);

        const nonce = await (async () => {
          if (options.forceNonce) {
            const { data } = await refetchNonce();
            return data;
          }

          if (nonceRef.current) {
            return nonceRef.current;
          }

          return nonceData;
        })();

        if (nonce === undefined) {
          throw new Error('Nonce not available');
        }

        if (tokenName === undefined) {
          throw new Error('tokenName not available');
        }

        if (tokenVersion === undefined) {
          throw new Error('tokenVersion not available');
        }
        // Create EIP2612 permit signature data for USDC token
        const permitData = {
          domain: {
            name: tokenName,
            version: tokenVersion,
            chainId,
            verifyingContract: auction.bidToken as Hex,
          },
          types: {
            Permit: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'nonce', type: 'uint256' },
              { name: 'deadline', type: 'uint256' },
            ],
          },
          primaryType: 'Permit',
          message: {
            owner: evmAddress as Hex,
            spender: auction.contract as Hex,
            value: bidAmountWei,
            nonce,
            deadline: permitDeadline,
          },
        };

        // Sign the permit
        const permitSignature = await walletClient.signTypedData({
          account: walletClient.account,
          ...permitData,
        } as SignTypedDataParameters);

        const data = await fetchBidTransactionData({
          castHash: cast.hash,
          bidderAddress: evmAddress as Hex,
          bidAmount: bidAmountWei.toString(),
          permit: {
            signature: permitSignature,
            deadline: Number(permitDeadline),
          },
        });

        const request = {
          account: evmAddress as Hex,
          to: data.params.to as Hex,
          chain: viemChain,
          value: BigInt(data.params.value),
          data: data.params.data as Hex,
        };

        // Store the request for potential error simulation
        lastTransactionRequestRef.current = {
          account: request.account,
          to: request.to,
          value: request.value,
          data: request.data,
        };

        return request;
      };

      const recordBidWalletTransaction = async (txHash: string) => {
        try {
          await recordWalletTransaction({
            params: {
              ethChainId: chainId,
              ethAddress: evmAddress as Hex,
              ethTxHash: txHash,
              provider: 'warpcast',
              metadata: {
                type: 'bid' as const,
                castHash: cast.hash,
                bid,
              },
            },
          });
        } catch (error) {
          logInDevOnly('Failed to record bid wallet transaction', error);
        }
      };

      const handleProcessed = (txHash: string) => {
        addPendingTransaction({
          chain,
          txHash,
        });

        void recordBidWalletTransaction(txHash);
      };

      const handleSuccess = async (txHash: string) => {
        try {
          setLocalBid({
            state: 'succeeded',
            bid,
          });

          // Optimistically bump the nonceRef given we just consumed this nonce,
          // we'll refetch it anyway but in the meantime take a better guess
          if (nonceRef.current) {
            nonceRef.current = nonceRef.current + 1n;
          }

          triggerSuccessNotificationAsync();

          removePendingTransaction(txHash);

          refreshWallet([
            {
              chain,
              ca: auction.bidToken as Hex,
              decimals: 6,
            },
          ]);

          // Refetch nonce for next potential bid
          refetchNonce();

          // We should move to smarter optimistic updates but this should work for now.
          setTimeout(() => {
            invalidateCastCollectiblesIndex(null);
          }, 1250);

          logInDevOnly('e2e tx time', Date.now() - start);
          trackEvent(AnalyticsEvent.CollectCastBidConfirmed, {
            castHash: cast.hash,
            castFid: cast.author.fid,
            castUsername: cast.author.username,
            amount: parseFloat(bidAmount),
            remainingAuctionTime: auction.end - Date.now(),
            submitToConfirmedTime: Date.now() - start,
          });
        } finally {
          bidSubmissionInFlightRef.current = false;
        }
      };

      const handleError = async (error?: Error, txHash?: string) => {
        logInDevOnly('error in collect tx', error);

        let errorMessage: string = 'Bid failed';
        let revertReason: string | undefined;
        let forceUpdate = false;
        let retryingWithFreshNonce = false;

        try {
          // If we have a transaction request, try to simulate it to get a better error
          if (lastTransactionRequestRef.current) {
            try {
              const viemChain = extractWalletChain({
                id: chainId as WalletChainId,
              });
              const publicClient = getEthereumClient({ chain: viemChain });

              const { functionName, args } = decodeFunctionData({
                abi: collectibleCastsAuctionAbi,
                data: lastTransactionRequestRef.current.data,
              });

              if (functionName === 'bid' || functionName === 'start') {
                await publicClient.simulateContract({
                  account: lastTransactionRequestRef.current.account,
                  address: lastTransactionRequestRef.current.to,
                  abi: collectibleCastsAuctionAbi,
                  functionName,
                  // @ts-expect-error - backend constructs overloaded auction txs
                  args,
                });
              }
            } catch (simulationError) {
              // Extract revert reason from simulation error
              if (simulationError instanceof BaseError) {
                const revertError = simulationError.walk(
                  (err) => err instanceof ContractFunctionRevertedError,
                ) as ContractFunctionRevertedError;

                if (revertError) {
                  revertReason =
                    revertError.reason || revertError?.data?.errorName;

                  if (
                    revertError.reason === 'EIP2612: invalid signature' &&
                    !options.forceNonce
                  ) {
                    logInDevOnly(
                      'Invalid signature, reattempting with forceNonce',
                    );
                    retryingWithFreshNonce = true;
                    bidSubmissionInFlightRef.current = false;
                    return await submitBid({ forceNonce: true });
                  }

                  if (revertError.data?.errorName) {
                    // Check if we have a known error message from the ABI
                    const errorMap: Record<string, string> = {
                      InvalidBidAmount: 'Someone outbid you',
                      AuctionNotActive: 'Auction not active',
                      AuctionEnded: 'Auction ended',
                      InvalidSignature: 'Invalid permit signature',
                      InsufficientAllowance: 'Insufficient allowance',
                      InsufficientBalance: 'Insufficient balance',
                    };

                    if (
                      [
                        'InvalidBidAmount',
                        'AuctionNotActive',
                        'AuctionEnded',
                      ].includes(revertError.data.errorName)
                    ) {
                      forceUpdate = true;
                    }

                    errorMessage =
                      errorMap[revertError.data?.errorName] ??
                      'Bid transaction failed';
                  }
                }
              }
            }
          }

          // Show bid failed toast with transaction styling
          toast.show('bid-failed', {
            type: 'transaction',
            placement: 'top',
            duration: 3000,
            data: {
              metadata: { type: 'bid' as const },
              chain,
              message: errorMessage,
            },
          });

          if (forceUpdate) {
            forceUpdateAuction();
          }

          setLocalBid(undefined);

          if (txHash) {
            removePendingTransaction(txHash);
          }

          trackEvent(AnalyticsEvent.CollectCastBidFailed, {
            castHash: cast.hash,
            castFid: cast.author.fid,
            castUsername: cast.author.username,
            amount: parseFloat(bidAmount),
            error: errorMessage || error?.message,
            rawError: error?.message,
            revertReason,
            txHash,
          });
        } finally {
          if (!retryingWithFreshNonce) {
            bidSubmissionInFlightRef.current = false;
          }
        }
      };

      const args = {
        protocol: 'ethereum' as const,
        chain,
        buildTransaction,
        onProcessed: handleProcessed,
        onSuccess: handleSuccess,
        onError: handleError,
        toast: false,
        disableHaptics: true,
        metadata: {
          type: 'bid' as const,
          cast: {
            ...cast,
            collectible: {
              ...cast.collectible!,
              state: 'auction-active' as const,
              auction: {
                ...auction,
                topBid: bid,
              },
            },
          },
          bid,
        },
      };

      const { deduped } = submitTransaction(args);
      if (deduped) {
        bidSubmissionInFlightRef.current = false;
      }

      trackEvent(AnalyticsEvent.SubmitCollectCastBid, {
        castHash: cast.hash,
        castFid: cast.author.fid,
        castUsername: cast.author.username,
        amount: parseFloat(bidAmount),
        minBid: parseFloat(minBid),
        extraBid: parseFloat(bidAmount) - parseFloat(minBid),
        remainingAuctionTime: auction.end - Date.now(),
      });
    },
    [
      auction,
      user.fid,
      user.username,
      user.displayName,
      user.pfp,
      bidAmount,
      setLocalBid,
      chainId,
      chain,
      cast,
      submitTransaction,
      trackEvent,
      minBid,
      getWalletClient,
      tokenName,
      tokenVersion,
      evmAddress,
      fetchBidTransactionData,
      nonceData,
      refetchNonce,
      addPendingTransaction,
      recordWalletTransaction,
      triggerSuccessNotificationAsync,
      removePendingTransaction,
      refreshWallet,
      invalidateCastCollectiblesIndex,
      toast,
      getEthereumClient,
      forceUpdateAuction,
      apiClient,
      gaslessQuoteResponse,
      needsGas,
    ],
  );

  return {
    submitBid,
    bidError,
    calculateBidError,
    balanceFloat,
    isBalanceLoading,
    minBid,
    bidAmount,
    setBidAmount,
    needsGas,
  };
}
