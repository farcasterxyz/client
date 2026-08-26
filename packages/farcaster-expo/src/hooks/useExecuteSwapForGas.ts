// eslint-disable-next-line no-restricted-imports
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToViemChainOrThrow,
  ApiSwapQuote,
  ApiWalletSwapForGasApplicationUsage,
  chainIdToChainOrThrow,
  FarcasterApiClient,
} from 'farcaster-client-data';
import {
  buildSwapTokensForGasKey,
  sleep,
  useFarcasterApiClient,
  useSwapTokensForGas,
} from 'farcaster-client-hooks';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Chain, WalletClient } from 'viem';
import { z } from 'zod';

import { useSharedTelemetry } from '../contexts';
import { useWalletRefresh } from './useWalletRefresh';

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
  console.log('[swap-debug][useExecuteSwapForGas]', ...args);
};

// State types for the gasless transaction flow
const POLLING_INTERVAL = 500;
const POLLING_TIMEOUT = 20000;
const ANALYTICS_VERSION = 'v2';

export type GaslessState =
  | { state: 'idle' }
  | { state: 'loading'; what: 'quote' | 'execute' | 'monitor' }
  | { state: 'error'; error: string }
  | { state: 'success'; transactionHash?: string };

// EIP712 schema for typed data signing
const EIP712DomainSchema = z.object({
  chainId: z.number(),
  name: z.string(),
  verifyingContract: z.string(),
  version: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EIP712Schema = z.object({
  types: z.unknown(),
  domain: EIP712DomainSchema.optional(),
  message: z.unknown(),
  primaryType: z.string(),
});

export type EIP712 = z.infer<typeof EIP712Schema>;

export interface SwapForGasIntent {
  sellAmountBaseUnits: string;
  sellToken: string;
}

interface UseExecuteSwapForGasProps {
  chainId?: number;
  swapIntent?: SwapForGasIntent;
  enabled?: boolean;
  getWalletClient: (chain: Chain) => Promise<WalletClient>;
  applicationUsage: ApiWalletSwapForGasApplicationUsage;
}

export interface UseExecuteSwapForGasResults {
  gaslessQuote: ApiSwapQuote | undefined | null;
  executeQuote: () => void;
  status: GaslessState;
  reset: () => void;
}

export async function executeQuoteAsync({
  quote,
  chainId,
  apiClient,
  client,
  applicationUsage,
}: {
  quote: ApiSwapQuote;
  chainId: number;
  apiClient: FarcasterApiClient;
  client: WalletClient;
  applicationUsage: ApiWalletSwapForGasApplicationUsage;
}) {
  if (!quote) {
    throw new Error('No gasless quote available');
  }
  if (!chainId) {
    throw new Error('No chain ID provided');
  }
  if (quote.steps.length !== 1) {
    throw new Error('Invalid number of steps in quote');
  }

  const items = quote.steps[0].items;
  if (items.length < 1 || items.length > 2) {
    throw new Error('Invalid quote');
  }

  // Find the permit and trade permission items
  const permit = items.find(
    (item) => item.type === 'signature' && item.data.type === 'permit',
  );

  const tradePermission = items.find(
    (item) =>
      item.type === 'signature' && item.data.type === 'settler_metatransaction',
  );

  if (!tradePermission) {
    throw new Error('Trade permission should always be present');
  }

  const tradeMsg =
    tradePermission.type === 'signature' &&
    tradePermission.data.type === 'settler_metatransaction'
      ? ((tradePermission.data as { message?: Record<string, unknown> })
          .message ?? {})
      : {};
  const permitMsg =
    permit?.type === 'signature' && permit.data.type === 'permit'
      ? ((permit.data as { message?: Record<string, unknown> }).message ?? {})
      : {};
  const tradeTaker = (tradeMsg as { taker?: string }).taker?.toLowerCase();
  const permitOwner = (permitMsg as { owner?: string }).owner?.toLowerCase();
  const signer = client.account?.address?.toLowerCase();

  siwfLog('executeQuoteAsync ENTRY', {
    quoteUid: quote.uid,
    chainId,
    stepsCount: quote.steps.length,
    itemsCount: items.length,
    hasPermit: !!permit,
    hasTradePermission: !!tradePermission,
    signer,
    tradeTaker,
    permitOwner,
    takerSignerMismatch: !!(signer && tradeTaker && signer !== tradeTaker),
    permitOwnerSignerMismatch: !!(
      signer &&
      permitOwner &&
      signer !== permitOwner
    ),
    clientChainId: client.chain?.id,
    ts: Date.now(),
  });

  // Handle approval if needed
  let approval;
  if (
    permit?.data &&
    permit.type === 'signature' &&
    permit.data.type === 'permit'
  ) {
    const { hash, type, ...rest } = permit.data;

    siwfLog('signing PERMIT typed data', {
      hash,
      type,
      domain: (rest as { domain?: unknown }).domain,
      primaryType: (rest as { primaryType?: unknown }).primaryType,
      messageKeys: Object.keys((rest as { message?: object }).message ?? {}),
      account: client.account?.address,
      ts: Date.now(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signature = await client.signTypedData(rest as any);
    siwfLog('PERMIT signature returned', {
      hash,
      signature,
      sigLen: signature?.length,
      ts: Date.now(),
    });
    approval = {
      hash,
      type,
      ...rest,
      signature,
    };
  }

  // Handle trade signature (always required)
  let trade;
  if (
    tradePermission.type === 'signature' &&
    tradePermission.data.type === 'settler_metatransaction'
  ) {
    const { hash, type, ...rest } = tradePermission.data;
    siwfLog('signing TRADE (settler_metatransaction) typed data', {
      hash,
      type,
      domain: (rest as { domain?: unknown }).domain,
      primaryType: (rest as { primaryType?: unknown }).primaryType,
      messageKeys: Object.keys((rest as { message?: object }).message ?? {}),
      // dump the message itself — most useful for verifying what was actually
      // hashed vs what backend / 0x expected. Includes taker, expiry, amounts.
      message: (rest as { message?: unknown }).message,
      account: client.account?.address,
      ts: Date.now(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signature = await client.signTypedData(rest as any);
    siwfLog('TRADE signature returned', {
      hash,
      signature,
      sigLen: signature?.length,
      // breakdown so we can spot compact (64-byte) vs standard (65-byte)
      sigFirstByte: signature?.slice(0, 4),
      sigLastByte: signature?.slice(-2),
      ts: Date.now(),
    });
    trade = {
      hash,
      type,
      ...rest,
      signature,
    };
  } else {
    throw new Error('This should never happen');
  }

  siwfLog('posting to /v2/swaps/gasless/execute', {
    uid: quote.uid,
    chainId,
    hasApproval: !!approval,
    tradeHash: trade.hash,
    tradeType: trade.type,
    tradeSig: trade.signature,
    approvalHash: approval?.hash,
    approvalSig: approval?.signature,
    applicationUsage,
    ts: Date.now(),
  });
  let result;
  try {
    result = await apiClient.postSwapQuoteForGasSwap({
      uid: quote.uid,
      chainId,
      trade,
      approval,
      applicationUsage,
    });
    siwfLog('postSwapQuoteForGasSwap OK', {
      success: result.data.result.success,
      uid: result.data.result.uid,
      ts: Date.now(),
    });
  } catch (e) {
    siwfLog('postSwapQuoteForGasSwap THREW', {
      errorName: (e as Error)?.name,
      errorMessage: (e as Error)?.message,
      // capture viem-style error metadata if present
      errorDetails: (e as { details?: unknown })?.details,
      errorCause: (e as { cause?: unknown })?.cause,
      ts: Date.now(),
    });
    throw e;
  }

  // Validate the result
  if (result.data.result.success !== true) {
    throw new Error('Gasless swap did not go through');
  }

  if (!result.data.result.uid) {
    throw new Error('Gasless swap did not go through');
  }

  return result.data.result.uid;
}

// Helper hook to monitor gasless transaction status
const useMonitorGaslessState = ({
  requestId,
  chainId,
  enabled,
  applicationUsage,
}: {
  requestId?: string;
  chainId?: number;
  enabled?: boolean;
  applicationUsage: ApiWalletSwapForGasApplicationUsage;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const startTimeRef = useRef<number | null>(null);
  const { trackEvent } = useSharedTelemetry();

  // Reset timer when request ID changes
  useEffect(() => {
    startTimeRef.current = requestId ? Date.now() : null;
    return () => {
      startTimeRef.current = null;
    };
  }, [requestId]);

  return useQuery({
    queryKey: ['gasless-state', requestId],
    enabled: enabled !== false && !!requestId && !!chainId,
    queryFn: async () => {
      if (!requestId) {
        throw new Error('No request ID provided');
      }
      if (!chainId) {
        throw new Error('No chain ID provided');
      }
      trackEvent(AnalyticsEvent.GaslessPollingStarted, {
        chainId,
        applicationUsage,
        version: ANALYTICS_VERSION,
      });

      // Initialize start time on first query if not already set
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }

      // Check if we've been polling for more than 20 seconds
      if (
        startTimeRef.current &&
        Date.now() - startTimeRef.current > POLLING_TIMEOUT
      ) {
        throw new Error('Polling aborted after 20 seconds timeout');
      }

      const result = await apiClient.getGaslessStatus({
        requestId,
        chainId,
      });

      // If status is confirmed, reset the timer
      if (result.data.result?.status === 'confirmed') {
        trackEvent(AnalyticsEvent.GaslessPollingCompleted, {
          chainId,
          applicationUsage,
          version: ANALYTICS_VERSION,
        });
        startTimeRef.current = null;
      }

      return result.data;
    },
    refetchInterval: ({ state }) => {
      // Don't refetch if there's an error or if status is confirmed
      if (state.error || state.data?.result?.status === 'confirmed') {
        return false;
      }
      return POLLING_INTERVAL;
    },
    refetchIntervalInBackground: true,
  });
};

/**
 * Hook for executing token swaps to cover gas fees
 *
 * @param options Configuration options for the swap
 * @param options.chainId The chain ID to execute the swap on
 * @param options.swapIntent Details about the token to swap
 * @param options.getWalletClient Function to get wallet client for transaction signing
 * @param options.enabled Controls whether the underlying queries are enabled (similar to React Query)
 * @returns Information and functions to handle the swap operation
 */
export function useExecuteSwapForGas({
  chainId,
  swapIntent,
  getWalletClient,
  enabled = true,
  applicationUsage = 'other',
}: UseExecuteSwapForGasProps): UseExecuteSwapForGasResults {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const { trackEvent } = useSharedTelemetry();
  const refreshWallet = useWalletRefresh();
  const successfullySubmitted = useRef<Map<string, string>>(new Map());

  // Get the gasless quote
  const {
    data: gaslessQuoteResponse,
    isLoading: isLoadingGaslessQuote,
    isError: isErrorGaslessQuote,
    error: errorGaslessQuote,
    isFetching: isFetchingGaslessQuote,
    refetch,
  } = useSwapTokensForGas({
    chainId,
    sellAmountBaseUnits: swapIntent?.sellAmountBaseUnits,
    sellToken: swapIntent?.sellToken,
    enabled,
  });

  // Extract the quote if available and valid
  const gaslessQuote = useMemo(() => {
    if (enabled === false) {
      return undefined;
    }

    if (!gaslessQuoteResponse) {
      return undefined;
    }
    if (isFetchingGaslessQuote) {
      return undefined;
    }
    return gaslessQuoteResponse.quote.success
      ? gaslessQuoteResponse.quote
      : null;
  }, [gaslessQuoteResponse, isFetchingGaslessQuote, enabled]);

  // Mutation to execute the swap
  const mutation = useMutation({
    mutationFn: async ({
      quote,
    }: {
      quote: ApiSwapQuote | undefined | null;
    }): Promise<string> => {
      // Prevent execution if disabled
      if (enabled === false) {
        throw new Error('Cannot execute swap when hook is disabled');
      }

      if (!quote) {
        throw new Error('No gasless quote available');
      }
      if (!chainId) {
        throw new Error('No chain ID provided');
      }

      trackEvent(AnalyticsEvent.GaslessRequestedQuoteStarted, {
        chainId,
        sellToken: quote.price.sell.token.symbol,
        buyToken: quote.price.buy.token.symbol,
        applicationUsage,
        version: ANALYTICS_VERSION,
      });

      const chain = apiChainToViemChainOrThrow(
        chainIdToChainOrThrow(chainId.toString()),
      );
      const client = await getWalletClient(chain);

      const cachedUid = successfullySubmitted.current.get(quote.uid);
      if (cachedUid !== undefined) {
        return cachedUid;
      }
      const uid = await executeQuoteAsync({
        quote,
        chainId,
        apiClient,
        client,
        applicationUsage,
      });
      if (uid !== undefined) {
        successfullySubmitted.current.set(quote.uid, uid);
      }

      trackEvent(AnalyticsEvent.GaslessRequestedQuoteCompleted, {
        chainId,
        sellToken: quote.price.sell.token.symbol,
        buyToken: quote.price.buy.token.symbol,
        applicationUsage,
        version: ANALYTICS_VERSION,
      });

      // Artificial delay for transaction confirmation
      setTimeout(async () => {
        const tokens = [];

        const sellChainId = quote.price.sell.token.chainId;
        if (sellChainId) {
          tokens.push({
            chain: chainIdToChainOrThrow(sellChainId.toString()),
            ca: quote.price.sell.token.address,
            decimals: quote.price.sell.token.decimals,
          });
        }

        const buyChainId = quote.price.buy.token.chainId;
        if (buyChainId) {
          tokens.push({
            chain: chainIdToChainOrThrow(buyChainId.toString()),
            ca: quote.price.buy.token.address,
            decimals: quote.price.buy.token.decimals,
          });
        }

        await refreshWallet(tokens);
      }, 3000);

      return uid;
    },
  });

  useEffect(() => {
    if (mutation.isError) {
      trackEvent(AnalyticsEvent.GaslessRequestedQuoteFailed, {
        chainId,
        sellToken: gaslessQuote?.price.sell.token.symbol,
        buyToken: gaslessQuote?.price.buy.token.symbol,
        applicationUsage,
        version: ANALYTICS_VERSION,
      });
    }
  }, [mutation.isError, gaslessQuote, trackEvent, chainId, applicationUsage]);

  // Monitor the gasless transaction state
  const {
    data: gaslessPollingState,
    isLoading: isLoadingGaslessState,
    error: gaslessPollingError,
    isError: isErrorGaslessPolling,
  } = useMonitorGaslessState({
    chainId,
    requestId: mutation.data,
    enabled, // Pass the enabled flag to monitoring hook
    applicationUsage,
  });

  // Function to execute the quote
  const executeQuote = useCallback(() => {
    if (enabled === false) {
      throw new Error('Cannot execute swap when hook is disabled');
    }

    mutation.mutateAsync({
      quote: gaslessQuote,
    });
  }, [gaslessQuote, mutation, enabled]);

  // Determine the current state of the flow
  const status: GaslessState = useMemo(() => {
    // If explicitly disabled, always return idle state
    if (enabled === false) {
      return {
        state: 'idle',
      };
    }

    if (isErrorGaslessPolling) {
      return {
        state: 'error',
        error:
          gaslessPollingError instanceof Error
            ? gaslessPollingError.message
            : String(gaslessPollingError),
      };
    }

    if (mutation.isError) {
      return {
        state: 'error',
        error:
          mutation.error instanceof Error
            ? mutation.error.message
            : String(mutation.error),
      };
    }

    if (isErrorGaslessQuote) {
      return {
        state: 'error',
        error:
          errorGaslessQuote instanceof Error
            ? errorGaslessQuote.message
            : String(errorGaslessQuote),
      };
    }

    if (isLoadingGaslessQuote) {
      return {
        state: 'loading',
        what: 'quote',
      };
    }

    if (mutation.isPending) {
      return {
        state: 'loading',
        what: 'execute',
      };
    }

    if (isLoadingGaslessState) {
      return {
        state: 'loading',
        what: 'monitor',
      };
    }

    if (gaslessPollingState?.result.status === 'confirmed') {
      return {
        state: 'success',
        transactionHash: gaslessPollingState.result.transactionHash,
      };
    }

    if (
      gaslessPollingState?.result.status === 'pending' ||
      gaslessPollingState?.result.status === 'submitted'
    ) {
      return {
        state: 'loading',
        what: 'monitor',
      };
    }

    return {
      state: 'idle',
    };
  }, [
    enabled,
    mutation.isError,
    mutation.error,
    mutation.isPending,
    isErrorGaslessQuote,
    errorGaslessQuote,
    isLoadingGaslessQuote,
    isLoadingGaslessState,
    gaslessPollingState,
    isErrorGaslessPolling,
    gaslessPollingError,
  ]);

  const reset = useCallback(() => {
    // Don't reset if explicitly disabled
    if (enabled === false) {
      return;
    }

    mutation.reset();
    queryClient.resetQueries({
      queryKey: buildSwapTokensForGasKey({
        chainId,
        sellAmountBaseUnits: swapIntent?.sellAmountBaseUnits,
        sellToken: swapIntent?.sellToken,
      }),
    });
    refetch();
  }, [
    enabled,
    mutation,
    queryClient,
    chainId,
    swapIntent?.sellAmountBaseUnits,
    swapIntent?.sellToken,
    refetch,
  ]);

  return {
    gaslessQuote,
    executeQuote,
    status,
    reset,
  };
}

export async function waitForQuoteToComplete({
  requestId,
  chainId,
  apiClient,
  timeoutMs = POLLING_TIMEOUT,
  pollIntervalMs = POLLING_INTERVAL,
  setTxHash,
}: {
  requestId: string;
  chainId: number;
  apiClient: FarcasterApiClient;
  timeoutMs?: number;
  pollIntervalMs?: number;
  setTxHash: (txHash: `0x${string}` | undefined) => void;
}) {
  if (!requestId) {
    throw new Error('No request ID provided');
  }
  if (!chainId) {
    throw new Error('No chain ID provided');
  }

  const startTime = Date.now();

  // Poll until we get a confirmed status or timeout

  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Polling aborted after ${timeoutMs}ms timeout`);
    }

    // Get current status
    const response = await apiClient.getGaslessStatus({
      requestId,
      chainId,
    });

    const result = response.data.result;

    if (result.transactionHash) {
      setTxHash(result.transactionHash as `0x${string}`);
    }

    // If status is confirmed, we're done
    if (result?.status === 'confirmed') {
      return result;
    }

    // If status is failed, throw an error
    if (result?.status === 'failed') {
      throw new Error('Gasless transaction failed');
    }

    // Wait before next poll
    await sleep(pollIntervalMs);
  }
}
