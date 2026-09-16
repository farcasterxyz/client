import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  ApiGetOnchainSwapQuoteRequestBody,
  ApiOnchainSwapQuoteError,
  ApiOnchainSwapQuoteSuccess,
  ApiOnchainSwapSource,
  ApiOnchainTokenMinimal,
  ApiPlatformType,
  ApiTokenLink,
  extractWalletChain,
  GASLESS_CHAINS,
  isNativeAsset,
  WalletChainId,
} from 'farcaster-client-data';
import {
  usdFloatToTokenQuantity,
  useFarcasterApiClient,
  useOnchainSwapQuote as useOnchainSwapQuoteRequest,
  useSwapTokensForGas,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useEstimateFeesPerGas } from 'wagmi';

import {
  PreparedWalletAction,
  useEmbeddedWallet,
  useSharedNavigationContext,
  useSharedTelemetry,
  useSharedWalletSwapStatusContext,
  useWalletTransactions,
} from '../../../../contexts';
import {
  executeQuoteAsync,
  useActiveWallet,
  useRecordTransaction,
  useSolanaMinBalance,
  useTokenBalance,
  useWalletBalances,
  useWalletNativeBalance,
  useWalletRefresh,
  useWalletSlippageSettings,
} from '../../../../hooks';
import {
  DEFAULT_SLIPPAGE_SETTINGS,
  formatAssetId,
  formatTokenDecimals,
  isSameAsset,
  logInDevOnly,
  parseTokenAmount,
  toAnalyticsName,
  tokenLinkToMinimalToken,
  tokenPositionToMinimalToken,
} from '../../../../utils';
import { useNativeTokenPrice } from './useNativeTokenPrice';
import { useRecentlySwappedTokens } from './useRecentlySwappedTokens';

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
  console.log('[swap-debug][useSwapQuotes]', ...args);
};

type AllowedSources = '0x' | 'relay' | 'jupiter-ultra' | 'liquidswap';

export type QuoteResult = {
  source: ApiOnchainSwapSource;
  quote?: ApiOnchainSwapQuoteSuccess;
  error?: ApiOnchainSwapQuoteError;
  isFetching: boolean;
  enabled: boolean;
};

export type PreparedQuote = {
  action: PreparedWalletAction;
  quote: ApiOnchainSwapQuoteSuccess;
  setBadQuoteAcceptance: (args: {
    userAcceptedBadQuote: boolean;
    acceptedQuoteSourceId?: string;
    acceptedQuoteBuyAmount?: string;
    acceptedAtMs?: number;
  }) => void;
};

type SwapState =
  | {
      state: 'pending';
    }
  | {
      state: 'processing';
    }
  | {
      state: 'confirmed';
      txHash: string;
    }
  | {
      state: 'reverted';
    };

function useOnchainSwapQuote(
  source: AllowedSources,
  args: Partial<ApiGetOnchainSwapQuoteRequestBody>,
): QuoteResult {
  const { swapAggregation } = useEmbeddedWallet();

  const enabled = React.useMemo(() => {
    const swapSources: Record<
      AllowedSources,
      {
        evm?: boolean;
        solana?: boolean;
        crossChain?: boolean;
        hyperevm?: boolean;
      }
    > = {
      '0x': {
        evm: true,
      },
      'jupiter-ultra': {
        solana: true,
      },
      relay: {
        crossChain: true,
        evm: swapAggregation,
        solana: swapAggregation,
      },
      liquidswap: {
        hyperevm: true,
      },
    };

    const config = swapSources[source];

    if (args.sellChain !== args.buyChain) {
      return !!config.crossChain;
    }

    if (args.sellChain === 'solana') {
      return !!config.solana;
    }

    if (args.sellChain === 'hyperevm') {
      return !!config.hyperevm;
    }

    if (args.sellChain === 'celo') {
      return !!config.crossChain;
    }

    return !!config.evm;
  }, [source, args, swapAggregation]);

  const { data, isFetching } = useOnchainSwapQuoteRequest({
    ...args,
    source,
    enabled,
  });

  return React.useMemo(() => {
    if (!enabled) {
      return { source, isFetching, enabled };
    }

    if (!data?.quote) {
      return { source, isFetching, enabled };
    }

    return {
      source,
      quote: data.quote.success ? data.quote : undefined,
      error: !data.quote.success ? data.quote : undefined,
      isFetching,
      enabled,
    };
  }, [data, isFetching, source, enabled]);
}

export function useSwapQuotes({
  sellToken,
  buyToken,
  sellTokenBalance,
  sellTokenPriceUsd,
  buyTokenBalance,
  sellAmount: rawSellAmount,
  attributedDomain,
  platformType,
  onSwapExecuted,
  onSuccess,
  onError,
  quickSwap,
  state,
  usdcDenominatedSwaps,
  percentageOfSellAmountChosen,
  assetPickerType,
}: {
  sellToken?: ApiTokenLink;
  buyToken?: ApiTokenLink;
  sellTokenBalance?: string;
  sellTokenPriceUsd?: number;
  buyTokenBalance?: string;
  sellAmount: string;
  platformType: ApiPlatformType;
  attributedDomain?: string;
  onSwapExecuted: () => void;
  onSuccess?: (hashes: string[]) => void;
  onError?: (reason: string) => void;
  quickSwap: boolean;
  state: SwapState;
  usdcDenominatedSwaps: boolean;
  percentageOfSellAmountChosen?: number;
  assetPickerType: 'crypto' | 'cash';
}) {
  const sellAmount = useMemo(() => {
    if (!usdcDenominatedSwaps) {
      return rawSellAmount;
    }
    if (!rawSellAmount) {
      return rawSellAmount;
    }
    if (!sellTokenPriceUsd || !sellToken?.decimals) {
      return rawSellAmount;
    }
    if (percentageOfSellAmountChosen) {
      const tokenBalance =
        (BigInt(sellTokenBalance ?? '0') *
          BigInt(percentageOfSellAmountChosen)) /
        BigInt(100);
      const normalized = formatUnits(tokenBalance, sellToken?.decimals ?? 18);
      return normalized.toString();
    }

    const raw = usdFloatToTokenQuantity({
      value: parseFloat(rawSellAmount),
      price: sellTokenPriceUsd,
      decimals: sellToken?.decimals ?? 18,
    });
    const decimals = BigInt(10 ** (sellToken?.decimals ?? 18));

    // Divide as float only when displaying
    const normalized = Number(raw) / Number(decimals);

    return normalized.toString();
  }, [
    rawSellAmount,
    sellToken?.decimals,
    sellTokenPriceUsd,
    usdcDenominatedSwaps,
    percentageOfSellAmountChosen,
    sellTokenBalance,
  ]);
  const { evmAddress, solanaAddress } = useEmbeddedWallet();
  const { prepareAction } = useWalletTransactions();
  const [slippageSettings = DEFAULT_SLIPPAGE_SETTINGS] =
    useWalletSlippageSettings();
  const { goBack } = useSharedNavigationContext();
  const { trackEvent } = useSharedTelemetry();
  const { balances } = useWalletBalances();
  const refreshWallet = useWalletRefresh();
  const recordTransaction = useRecordTransaction();
  const { trackRecentlySwappedTokens } = useRecentlySwappedTokens();
  const { onSuccess: onSwapStatusSuccess } = useSharedWalletSwapStatusContext();
  const { refetch: refetchSellTokenBalance } = useTokenBalance({
    chain: sellToken?.chain,
    ca: sellToken?.ca,
  });

  const nativePriceUsd = useNativeTokenPrice({
    chain: sellToken?.chain ?? 'base',
  });

  const solanaMinBalance = useSolanaMinBalance({
    enabled: sellToken?.chain === 'solana',
  });

  const [preparedQuote, setPreparedQuote] = useState<PreparedQuote | undefined>(
    undefined,
  );
  const [sellAmountWeiOverride, setSellAmountWeiOverride] = useState<
    string | undefined
  >(undefined);

  const { sellAmountWei, sellAmountError } = React.useMemo(() => {
    if (sellAmountWeiOverride) {
      return {
        sellAmountWei: sellAmountWeiOverride,
        sellAmountError: undefined,
      };
    }

    if (!sellToken || !sellAmount || sellAmount === '0') {
      return { sellAmountWei: undefined, sellAmountError: undefined };
    }

    const balance = balances.find((b) =>
      isSameAsset({
        chain: sellToken.chain,
        ca: sellToken.ca,
        asset: tokenPositionToMinimalToken(b),
      }),
    );

    const sellAmountFloat = parseFloat(sellAmount);
    if (sellAmountFloat === 0) {
      return { sellAmountWei: undefined, sellAmountError: undefined };
    }

    const currentAmountFloat = balance?.quantity.float ?? 0;

    // This needs to be a string to avoid precision issues

    const sellAmountWei = parseUnits(
      sellAmount.replace(/,/g, '.'),
      sellToken.decimals ?? 18,
    ).toString();

    if (!sellAmountWei || sellAmountWei === '0') {
      return {
        sellAmountWei: undefined,
        sellAmountError: {
          success: false as const,
          source: '0x' as const,
          error: 'NEEDS_GAS',
          message: 'Invalid amount',
        },
      };
    }

    if (sellAmountFloat > currentAmountFloat) {
      return {
        sellAmountWei,
        sellAmountError: {
          success: false as const,
          source: '0x' as const,
          error: 'INVALID_AMOUNT',
          message: 'Invalid amount',
        },
      };
    }

    return { sellAmountWei, sellAmountError: undefined };
  }, [sellAmountWeiOverride, sellToken, sellAmount, balances]);

  React.useEffect(() => {
    if (!sellToken || !sellTokenBalance) return;

    if (!preparedQuote) return;

    const isSellNative = isNativeAsset(sellToken.ca);
    const isMaxSellAmount = preparedQuote.quote.sellAmount === sellTokenBalance;
    if (!isSellNative || !isMaxSellAmount) return;

    const decimals = formatTokenDecimals(sellToken.chain, sellToken.decimals);

    // Always keep 1.5x the chain fee
    const bufferedChainFeeUsd = preparedQuote.quote.fees.chain.value * 1.5;
    // Guard against a missing native price (e.g. a chain whose native price
    // hasn't resolved yet): `x / 0` yields Infinity and crashes parseUnits.
    const bufferedChainFeeFloat =
      nativePriceUsd > 0 ? bufferedChainFeeUsd / nativePriceUsd : 0;
    const bufferedChainFee = parseUnits(
      bufferedChainFeeFloat.toFixed(decimals),
      decimals,
    );

    let newSellAmount =
      BigInt(preparedQuote.quote.sellAmount) - bufferedChainFee;

    if (sellToken.chain === 'solana') {
      newSellAmount -= solanaMinBalance;
    }

    setSellAmountWeiOverride(newSellAmount.toString());
  }, [
    preparedQuote,
    sellToken,
    sellTokenBalance,
    nativePriceUsd,
    setSellAmountWeiOverride,
    solanaMinBalance,
    sellAmount,
  ]);

  React.useEffect(() => {
    setSellAmountWeiOverride(undefined);
  }, [sellAmount]);

  const request = React.useMemo(() => {
    if (state.state !== 'pending' || assetPickerType === 'cash') {
      return {};
    }

    const slippageBps = slippageSettings.auto
      ? undefined
      : Math.max(Math.round(slippageSettings.slippage * 100), 0);

    const taker = sellToken?.chain === 'solana' ? solanaAddress : evmAddress;
    const recipient = buyToken?.chain === 'solana' ? solanaAddress : evmAddress;

    siwfLog('useSwapQuotes building request', {
      taker,
      recipient,
      evmAddress,
      solanaAddress,
      sellChain: sellToken?.chain,
      buyChain: buyToken?.chain,
      ts: Date.now(),
    });

    return {
      sellChain: sellToken?.chain,
      sellToken: sellToken?.ca,
      sellAmount: sellAmountWei,
      sellDecimals: sellToken?.decimals,
      buyChain: buyToken?.chain,
      buyToken: buyToken?.ca,
      buyDecimals: buyToken?.decimals,
      slippageBps,
      taker,
      recipient,
      sellPriceUsd: parseFloat(sellToken?.priceUsd ?? '0'),
      nativePriceUsd,
    };
  }, [
    sellToken,
    buyToken,
    slippageSettings,
    evmAddress,
    solanaAddress,
    nativePriceUsd,
    sellAmountWei,
    state,
    assetPickerType,
  ]);

  const quote0x = useOnchainSwapQuote('0x', request);
  const quoteRelay = useOnchainSwapQuote('relay', request);
  const quoteJupiter = useOnchainSwapQuote('jupiter-ultra', request);
  const quoteLiquidswap = useOnchainSwapQuote('liquidswap', request);

  const allQuotes = React.useMemo((): QuoteResult[] => {
    const results = [quote0x, quoteRelay, quoteJupiter, quoteLiquidswap];

    return results
      .filter((result) => result.quote || result.error)
      .sort((a, b) => {
        if (a.error && b.error) {
          return 0;
        }
        if (a.error) {
          return 1;
        }
        if (b.error) {
          return -1;
        }

        const aBuyAmount = a.quote?.buyAmount ? BigInt(a.quote.buyAmount) : 0;
        const bBuyAmount = b.quote?.buyAmount ? BigInt(b.quote.buyAmount) : 0;
        return aBuyAmount > bBuyAmount ? -1 : 1;
      });
  }, [quote0x, quoteRelay, quoteJupiter, quoteLiquidswap]);

  const {
    quote,
    quoteError: internalQuoteError,
    isFetchingQuote,
  } = React.useMemo(() => {
    const quoteSources = [quote0x, quoteRelay, quoteJupiter, quoteLiquidswap];
    const validQuotes = allQuotes.filter((q) => q.quote && !q.error);
    const bestQuote = validQuotes.length > 0 ? validQuotes[0] : undefined;
    const quote = bestQuote?.quote;
    const quoteError = allQuotes.find((q) => q.error)?.error;

    const hasRequested =
      !!request.sellToken &&
      !!request.buyToken &&
      !!request.sellAmount &&
      parseFloat(request.sellAmount) > 0;
    const hasResponded = !!quote || !!quoteError;

    // Only spin while an enabled source is actually in-flight. The previous
    // `hasRequested && !hasResponded` check stayed true forever when no source
    // produced a quote/error (e.g. underlying query never became enabled).
    const isFetchingQuote =
      hasRequested &&
      !hasResponded &&
      quoteSources.some((result) => result.enabled && result.isFetching);

    return {
      quote,
      quoteError: !quote ? quoteError : undefined,
      isFetchingQuote,
    };
  }, [allQuotes, request, quote0x, quoteRelay, quoteJupiter, quoteLiquidswap]);

  const {
    fundGas,
    isLoading: isLoadingFundGas,
    fundGasError,
    fundGasQuote,
  } = useMaybeFundGas({
    sellToken: sellToken ? tokenLinkToMinimalToken(sellToken) : undefined,
    sellTokenBalance,
    buyTokenBalance,
    quote,
    nativePriceUsd,
  });

  const quoteError = React.useMemo(() => {
    if (internalQuoteError) {
      return internalQuoteError;
    }
    if (sellAmountError) {
      return sellAmountError;
    }
    if (fundGasError) {
      return fundGasError;
    }
    return undefined;
  }, [internalQuoteError, sellAmountError, fundGasError]);

  const isFetching = React.useMemo(() => {
    // Terminal gas errors must clear the spinner — otherwise "Fetching quote"
    // wins over the NEEDS_GAS form error in the confirm button.
    if (fundGasError) {
      return false;
    }
    return isFetchingQuote || isLoadingFundGas;
  }, [isFetchingQuote, isLoadingFundGas, fundGasError]);

  React.useEffect(() => {
    if (quoteError) {
      const financialImpact = (
        quoteError as ApiOnchainSwapQuoteError & {
          financialImpact?: ApiOnchainSwapQuoteSuccess['financialImpact'];
        }
      ).financialImpact;
      trackEvent(AnalyticsEvent.SwapWalletQuoteError, {
        version: '2',
        error: quoteError.error,
        message: quoteError.message,
        financialImpactStatus: financialImpact?.status,
        financialImpactReason: financialImpact?.reason,
        financialImpactBlocked: financialImpact?.blocked,
        financialImpactWouldBlock: financialImpact?.wouldBlock,
        financialImpactValueLossBps: financialImpact?.valueLossBps,
        sellToken: sellToken
          ? toAnalyticsName(tokenLinkToMinimalToken(sellToken))
          : undefined,
        buyToken: buyToken
          ? toAnalyticsName(tokenLinkToMinimalToken(buyToken))
          : undefined,
      });
    }
  }, [quoteError, trackEvent, quote, sellToken, buyToken]);

  useEffect(() => {
    return () => {
      if (preparedQuote) {
        logInDevOnly('Destroying execution');
        preparedQuote.action.abandon();
      }
    };
  }, [preparedQuote]);

  const previousQuoteIdRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (state.state !== 'pending') {
      return;
    }

    if (!quote || !sellToken || !buyToken || assetPickerType === 'cash') {
      setPreparedQuote(undefined);
      return;
    }

    const usdValue = usdcDenominatedSwaps
      ? parseFloat(rawSellAmount || '0')
      : parseFloat(sellAmount) * (sellTokenPriceUsd ?? 0);

    const analyticsProperties = {
      version: '2',
      chain: sellToken.chain,
      sellToken: toAnalyticsName(tokenLinkToMinimalToken(sellToken)),
      buyToken: toAnalyticsName(tokenLinkToMinimalToken(buyToken)),
      usdValue,
      source: quote.source,
    };

    const badQuoteAcceptanceMetadata: {
      userAcceptedBadQuote?: boolean;
      acceptedQuoteSourceId?: string;
      acceptedQuoteBuyAmount?: string;
      acceptedAtMs?: number;
    } = {};

    const metadata = {
      type: 'swap-v2' as const,
      quote,
      request: {
        ...(request as ApiGetOnchainSwapQuoteRequestBody),
        source: quote.source,
      },
      ...badQuoteAcceptanceMetadata,
      sellToken: tokenLinkToMinimalToken(sellToken),
      buyToken: tokenLinkToMinimalToken(buyToken),
    };

    const handleExecute = () => {
      siwfLog('action.onExecute → fires onSwapExecuted', { ts: Date.now() });
      trackEvent(AnalyticsEvent.SwapWalletTransaction, analyticsProperties);
      onSwapExecuted();
    };

    const handleSuccess = async (txHash: string) => {
      siwfLog('action.onSuccess', { txHash, ts: Date.now() });
      onSwapStatusSuccess();

      trackEvent(
        AnalyticsEvent.SwapWalletTransactionSucceeded,
        analyticsProperties,
      );

      await Promise.all([
        recordTransaction({
          domain: attributedDomain,
          platformType,
          txHash,
          walletAddress:
            sellToken.chain === 'solana' ? solanaAddress! : evmAddress!,
          chain: sellToken.chain === 'solana' ? 'solana' : 'eth',
          chainId:
            sellToken.chain === 'solana'
              ? undefined
              : Number(apiChainToChainIdOrThrow(sellToken.chain)),
          metadata: {
            ...metadata,
            status: 'succeeded',
          },
        }),
        refetchSellTokenBalance(),
        refreshWallet([
          {
            ...sellToken,
            delta: `-${quote.sellAmount}`,
          },
          {
            ...buyToken,
            delta:
              sellToken.chain !== buyToken.chain ? quote.buyAmount : undefined,
            position: {
              chain: buyToken.chain,
              address: buyToken.ca,
              name: buyToken.name,
              symbol: buyToken.ticker,
              decimals: buyToken.decimals,
              iconUrl: buyToken.imageUrl,
              quantity: {
                int: quote.buyAmount,
                float: parseTokenAmount(
                  quote.buyAmount,
                  buyToken.decimals ?? 18,
                ),
              },
              value:
                parseFloat(buyToken.priceUsd ?? '0') *
                parseTokenAmount(quote.buyAmount, buyToken.decimals ?? 18),
              hidden: false,
              price: parseFloat(buyToken.priceUsd ?? '0'),
              features: {
                canTrade: true,
                isTestnet: false,
              },
              id: formatAssetId(buyToken.chain, buyToken.ca),
            },
          },
        ]),
      ]);

      trackRecentlySwappedTokens([
        tokenLinkToMinimalToken(sellToken),
        tokenLinkToMinimalToken(buyToken),
      ]);

      onSuccess?.([txHash]);
    };

    const handleError = async (error?: Error, txHash?: string) => {
      siwfLog('action.onError', {
        hasError: !!error,
        errorName: error?.name,
        errorMessage: error?.message,
        txHash,
        ts: Date.now(),
      });
      const financialImpact = (
        error as Error & {
          financialImpact?: ApiOnchainSwapQuoteSuccess['financialImpact'];
        }
      )?.financialImpact;
      const previousQuoteId = previousQuoteIdRef.current;
      const currentQuoteId = quote.sourceId;
      previousQuoteIdRef.current = currentQuoteId;
      if (currentQuoteId && currentQuoteId === previousQuoteId) {
        siwfLog('action.onError early-return (deduped by sourceId)', {
          currentQuoteId,
          ts: Date.now(),
        });
        return;
      }

      if (error) {
        trackEvent(AnalyticsEvent.SwapWalletTransactionError, {
          ...analyticsProperties,
          error: error.name,
          message: error.message,
          financialImpactStatus:
            financialImpact?.status ?? quote.financialImpact?.status,
          financialImpactReason:
            financialImpact?.reason ?? quote.financialImpact?.reason,
          financialImpactBlocked:
            financialImpact?.blocked ?? quote.financialImpact?.blocked,
          financialImpactWouldBlock:
            financialImpact?.wouldBlock ?? quote.financialImpact?.wouldBlock,
          financialImpactValueLossBps:
            financialImpact?.valueLossBps ??
            quote.financialImpact?.valueLossBps,
        });
      } else if (txHash) {
        trackEvent(
          AnalyticsEvent.SwapWalletTransactionReverted,
          analyticsProperties,
        );
      }

      await recordTransaction({
        domain: attributedDomain,
        platformType,
        txHash,
        walletAddress:
          sellToken.chain === 'solana' ? solanaAddress! : evmAddress!,
        chain: sellToken.chain === 'solana' ? 'solana' : 'eth',
        chainId:
          sellToken.chain === 'solana'
            ? undefined
            : Number(apiChainToChainIdOrThrow(sellToken.chain)),
        metadata: {
          ...metadata,
          status: txHash ? 'reverted' : 'error',
          error: error
            ? {
                name: error.name,
                message: error.message,
              }
            : undefined,
        },
      });

      onError?.(
        error?.name === 'FinancialImpactBlockedError'
          ? 'financial_impact_blocked'
          : 'swap_failed',
      );
    };

    const action = prepareAction({
      protocol: 'actions',
      chain: sellToken.chain,
      actions: quote.actions,
      metadata,
      onExecute: handleExecute,
      onSuccess: handleSuccess,
      onError: handleError,
      beforeExecute: fundGas,
      toast: quickSwap,
    });

    setPreparedQuote({
      action,
      quote,
      setBadQuoteAcceptance: ({
        userAcceptedBadQuote,
        acceptedQuoteSourceId,
        acceptedQuoteBuyAmount,
        acceptedAtMs,
      }) => {
        metadata.userAcceptedBadQuote = userAcceptedBadQuote;
        metadata.acceptedQuoteSourceId = acceptedQuoteSourceId;
        metadata.acceptedQuoteBuyAmount = acceptedQuoteBuyAmount;
        metadata.acceptedAtMs = acceptedAtMs;
      },
    });
  }, [
    attributedDomain,
    buyToken,
    evmAddress,
    fundGas,
    goBack,
    quickSwap,
    onError,
    onSuccess,
    onSwapExecuted,
    platformType,
    quote,
    recordTransaction,
    refreshWallet,
    request,
    rawSellAmount,
    sellAmount,
    sellToken,
    sellTokenPriceUsd,
    solanaAddress,
    trackEvent,
    trackRecentlySwappedTokens,
    refetchSellTokenBalance,
    prepareAction,
    onSwapStatusSuccess,
    state,
    assetPickerType,
    usdcDenominatedSwaps,
  ]);

  return {
    preparedQuote,
    quoteError,
    allQuotes,
    isFetching,
    fundGasQuote,
  };
}

function useMaybeFundGas({
  sellToken,
  buyTokenBalance,
  quote,
  nativePriceUsd,
}: {
  sellToken?: ApiOnchainTokenMinimal;
  sellTokenBalance?: string;
  buyTokenBalance?: string;
  quote?: ApiOnchainSwapQuoteSuccess;
  nativePriceUsd: number;
}) {
  const { evmAddress, solanaAddress, getWalletClient } = useEmbeddedWallet();
  const { apiClient } = useFarcasterApiClient();
  const { activeNamespace, activeWalletId } = useActiveWallet();
  // Only thread a walletId when a secondary wallet is active, so the
  // gas-bootstrap quote's taker matches the secondary signer. Primary stays
  // undefined → backend keeps the legacy primary-warpcast behavior.
  const gasWalletId =
    activeNamespace === 'secondary' ? activeWalletId : undefined;

  siwfLog('useMaybeFundGas wallet resolution', {
    activeNamespace,
    activeWalletId,
    gasWalletId,
    evmAddress,
    ts: Date.now(),
  });

  const chain = sellToken?.chain;
  const chainId = chain ? Number(apiChainToChainIdOrThrow(chain)) : undefined;

  const balance = useWalletNativeBalance({
    address: chain === 'solana' ? solanaAddress! : evmAddress!,
    chainId,
  });

  const { data: evmGasFees } = useEstimateFeesPerGas({
    chainId,
    query: {
      enabled: chain !== 'solana',
    },
  });

  const { maxFeePerGas, maxPriorityFeePerGas } = React.useMemo(() => {
    return {
      maxFeePerGas: evmGasFees?.maxFeePerGas ?? 0n,
      maxPriorityFeePerGas: evmGasFees?.maxPriorityFeePerGas ?? 0n,
    };
  }, [evmGasFees]);

  const solanaMinBalance = useSolanaMinBalance({
    enabled: sellToken?.chain === 'solana',
  });

  const needsGas = React.useMemo(() => {
    if (!balance || !quote?.success || !sellToken) {
      return false;
    }

    if (chain !== 'solana') {
      // Always keep 3x the evm fee
      const decimals = formatTokenDecimals(
        sellToken.chain,
        formatTokenDecimals(sellToken.chain),
      );

      const executionFeeUsd = quote.fees.chain.value;
      // Guard against a missing native price → Infinity → parseUnits crash.
      const executionFee =
        nativePriceUsd > 0 ? executionFeeUsd / nativePriceUsd : 0;
      const executionFeeWei = parseUnits(executionFee.toFixed(18), decimals);
      const totalFeeWei = executionFeeWei + maxFeePerGas + maxPriorityFeePerGas;
      const bufferedTotalFeeWei = totalFeeWei * 3n;

      return balance.value < bufferedTotalFeeWei;
    } else {
      let bufferedChainFee = solanaMinBalance;
      // Always keep 1.5x the minimum solana fee if no buy token balance
      if (!buyTokenBalance) {
        bufferedChainFee += solanaMinBalance / 2n;
      }
      return balance.value < bufferedChainFee;
    }
  }, [
    balance,
    quote,
    nativePriceUsd,
    sellToken,
    chain,
    solanaMinBalance,
    buyTokenBalance,
    maxFeePerGas,
    maxPriorityFeePerGas,
  ]);

  const isGaslessChain = !!chain && GASLESS_CHAINS.includes(chain);
  // Gasless bootstrap is only possible on supported chains. Never enable the
  // RQ query on non-gasless EVM chains (e.g. Robinhood) — disabled queries in
  // v5 report isPending forever without data.
  const shouldFetchFundGas = needsGas && isGaslessChain;

  const {
    data: fundGasQuote,
    isFetching: isFetchingFundGas,
    error: fundGasQueryError,
  } = useSwapTokensForGas({
    chainId,
    enabled: shouldFetchFundGas,
    sellAmountBaseUnits: quote?.sellAmount,
    sellToken: sellToken?.ca,
    walletId: gasWalletId,
  });

  const fundGasError = React.useMemo(() => {
    if (!needsGas) {
      return undefined;
    }

    if (chain === 'solana') {
      return {
        success: false as const,
        source: quote?.source ?? ('jupiter-ultra' as const),
        error: 'NEEDS_GAS',
        message: 'Invalid amount',
      };
    }

    // Gas can't be bootstrapped via a gasless swap on non-gasless EVM chains
    // (e.g. Robinhood Chain), so surface NEEDS_GAS immediately.
    if (!isGaslessChain) {
      return {
        success: false as const,
        source: quote?.source ?? ('0x' as const),
        error: 'NEEDS_GAS',
        message: 'Not enough native balance to cover chain fees',
      };
    }

    if (fundGasQueryError) {
      return {
        success: false as const,
        source: quote?.source ?? ('0x' as const),
        error: 'NEEDS_GAS',
        message: fundGasQueryError.message || 'No quote found',
      };
    }

    if (!fundGasQuote) {
      return undefined;
    }

    if (!fundGasQuote.quote.success) {
      return {
        success: false as const,
        source: quote?.source ?? ('0x' as const),
        error: 'NEEDS_GAS',
        message: fundGasQuote.quote.message ?? 'No quote found',
      };
    }

    return undefined;
  }, [
    fundGasQuote,
    fundGasQueryError,
    needsGas,
    quote?.source,
    chain,
    isGaslessChain,
  ]);

  const fundGas = React.useCallback(async () => {
    if (!fundGasQuote?.quote.success || !chainId || !needsGas) {
      return;
    }

    siwfLog('fundGas start → getWalletClient', {
      chainId,
      needsGas,
      ts: Date.now(),
    });
    const chain = extractWalletChain({ id: chainId as WalletChainId });
    const walletClient = await getWalletClient(chain);
    siwfLog('fundGas getWalletClient OK → executeQuoteAsync', {
      signerAddress: walletClient?.account?.address,
      ts: Date.now(),
    });

    const requestId = await executeQuoteAsync({
      quote: fundGasQuote.quote,
      chainId,
      apiClient,
      client: walletClient,
      applicationUsage: 'swap',
    });

    siwfLog('fundGas executeQuoteAsync done', { requestId, ts: Date.now() });
    if (!requestId) {
      throw new Error('Failed to execute quote');
    }

    let confirmed = false;
    const tries = 0;

    do {
      try {
        const result = await apiClient.getGaslessStatus({
          requestId,
          chainId,
        });
        siwfLog('fundGas getGaslessStatus poll', {
          tries,
          status: result.data.result?.status,
          ts: Date.now(),
        });
        if (result.data.result?.status === 'confirmed') {
          confirmed = true;
          break;
        }
      } catch (e) {
        siwfLog('fundGas getGaslessStatus poll threw', {
          tries,
          error: (e as Error)?.message,
          ts: Date.now(),
        });
        // do nothing
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    } while (tries < 10);
    siwfLog('fundGas poll loop exit', { confirmed, tries, ts: Date.now() });
    if (!confirmed) {
      throw new Error('Gasless swap failed');
    }
  }, [fundGasQuote, apiClient, chainId, getWalletClient, needsGas]);

  return {
    fundGas,
    // Use isFetching (not isPending): disabled RQ queries stay isPending forever
    // without ever fetching, which previously locked the UI on "Fetching quote".
    isLoading: shouldFetchFundGas && isFetchingFundGas,
    fundGasQuote: fundGasQuote?.quote.success ? fundGasQuote.quote : undefined,
    fundGasError,
  };
}
