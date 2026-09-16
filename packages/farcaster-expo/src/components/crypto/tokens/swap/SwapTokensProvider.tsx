import {
  ApiOnchainSwapQuoteError,
  ApiPlatformType,
  ApiSwapQuote,
  ApiTokenLink,
} from 'farcaster-client-data';
import React, { useRef } from 'react';
import { formatUnits } from 'viem';

import {
  useEmbeddedWallet,
  useSharedNavigationContext,
} from '../../../../contexts';
import { useWalletQuickSwap } from '../../../../hooks';
import { WalletSwapParams } from '../../../../types';
import { SwapWarning } from '../../../../utils/SwapWarnings';
import { useBuyTokenAsset } from './useBuyTokenAsset';
import { useCalculateSwapPriceImpact } from './useCalculateSwapPriceImpact';
import { useCalculateSwapWarnings } from './useCalculateSwapWarnings';
import { useSwapIntent } from './useSwapIntent';
import { PreparedQuote, QuoteResult, useSwapQuotes } from './useSwapQuotes';
import { useUsdcDenominatedSwaps } from './useUsdcDenominatedSwaps';

const SIWF_DEBUG = (() => {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.location.search.includes('debug-swap=1') ||
      window.localStorage?.getItem('debug-swap') === '1'
    );
  } catch {
    return false;
  }
})();
const siwfLog = (...args: unknown[]) => {
  if (!SIWF_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log('[swap-debug][swap-provider]', ...args);
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

type SwapTokensContextType = {
  initialize: (params: WalletSwapParams) => void;
  evmAddress: `0x${string}`;
  solanaAddress: string | undefined;
  sellToken: ApiTokenLink | undefined;
  setSellToken: (token: ApiTokenLink | undefined) => void;
  buyToken: ApiTokenLink | undefined;
  setBuyToken: (token: ApiTokenLink | undefined) => void;
  sellAmount: string;
  setSellAmount: (amount: string) => void;
  percentageOfSellAmountChosen: number | undefined;
  setPercentageOfSellAmountChosen: (value: number | null | undefined) => void;
  assetPickerType: 'crypto' | 'cash';
  setAssetPickerType: (type: 'crypto' | 'cash') => void;
  attributedDomain: string | undefined;
  platformType: ApiPlatformType;
  onSuccess?: (hashes: string[]) => void;
  onError?: (reason: string) => void;
  onSwapExecuted?: () => void;
  allQuotes: QuoteResult[];
  quoteError: ApiOnchainSwapQuoteError | undefined;
  fundGasQuote: ApiSwapQuote | undefined;
  preparedQuote: PreparedQuote | undefined;
  reverseTokens: () => void;
  buyTokenBalance: string | undefined;
  sellTokenBalance: string | undefined;
  isFetching: boolean;
  state: SwapState;
  tryAgain: () => void;
  isSellExperience: boolean;
  isBuyExperience: boolean;
  sellTokenUsdBalance: number | undefined;
  sellTokenPriceUsd: number | undefined;
  buyTokenUsdBalance: number | undefined;
  usdcDenominatedSwaps: boolean;
  warning: SwapWarning | undefined;
  priceImpact: {
    sellUsdValue: number;
    buyUsdValue: number;
    priceImpact: number;
    priceImpactUsd: number;
    showPriceImpactWarning: boolean;
    showHighPriceImpactWarning: boolean;
  };
  showDetailsSheet: boolean;
  setShowDetailsSheet: (show: boolean) => void;
};

const SwapTokensContext = React.createContext<
  SwapTokensContextType | undefined
>(undefined);

type SwapTokensProviderProps = WalletSwapParams & {
  children: React.ReactNode;
};

export function SwapTokensProvider({
  children,
  ...rest
}: SwapTokensProviderProps) {
  const { evmAddress, solanaAddress } = useEmbeddedWallet();
  const [params, setParams] = React.useState<WalletSwapParams>(rest);
  const { goBack } = useSharedNavigationContext();
  const [quickSwap = false] = useWalletQuickSwap();

  const [state, setState] = React.useState<SwapState>({ state: 'pending' });
  const [showDetailsSheet, setShowDetailsSheetState] = React.useState(false);
  const { usdcDenominatedSwaps: usdcDenominatedSwapsSettings = true } =
    useUsdcDenominatedSwaps();

  const percentageOfSellAmountChosen = useRef<number | undefined>(undefined);
  const setPercentageOfSellAmountChosen = React.useCallback(
    (value: number | null | undefined) => {
      percentageOfSellAmountChosen.current = value ?? undefined;
    },
    [],
  );
  const {
    sellToken,
    buyToken,
    sellAmount,
    setSellAmount,
    setBuyToken,
    setSellToken,
    buyTokenBalance,
    sellTokenBalance,
    reverseTokens,
    isSellExperience,
    isBuyExperience,
    sellTokenUsdBalance,
    sellTokenPriceUsd,
    buyTokenUsdBalance,
  } = useSwapIntent({
    swapIntent: params.swapIntent,
    isBuy: params.isBuy,
    isSell: params.isSell,
  });
  const usdcDenominatedSwaps = usdcDenominatedSwapsSettings;
  const { assetPickerType, setAssetPickerType } = useBuyTokenAsset({
    buyToken,
  });
  const handleSwapExecuted = React.useCallback(() => {
    siwfLog('handleSwapExecuted', {
      quickSwap,
      hasOnSwapExecuted: !!params.onSwapExecuted,
      ts: Date.now(),
    });
    params.onSwapExecuted?.();
    if (quickSwap) {
      goBack();
    } else {
      setState({ state: 'processing' });
    }
  }, [goBack, params, quickSwap]);

  const handleSetSellToken = React.useCallback(
    (token: ApiTokenLink | undefined) => {
      setSellToken(token);
      setAssetPickerType('crypto');
    },
    [setSellToken, setAssetPickerType],
  );

  const handleSwapSuccess = React.useCallback(
    (hashes: string[]) => {
      siwfLog('handleSwapSuccess', {
        hashesLen: hashes.length,
        firstHash: hashes[0],
        hasOnSuccess: !!params.onSuccess,
        ts: Date.now(),
      });
      params.onSuccess?.(hashes);
      setState({ state: 'confirmed', txHash: hashes[0] });
    },
    [params],
  );

  const handleSwapError = React.useCallback(
    (reason: string) => {
      siwfLog('handleSwapError', {
        reason,
        hasOnError: !!params.onError,
        ts: Date.now(),
      });
      params.onError?.(reason);
      setState({ state: 'reverted' });
    },
    [params],
  );

  const { quoteError, preparedQuote, allQuotes, isFetching, fundGasQuote } =
    useSwapQuotes({
      sellToken,
      sellTokenBalance,
      sellTokenPriceUsd,
      buyTokenBalance,
      sellAmount,
      buyToken,
      attributedDomain: params.attributedDomain,
      platformType: params.platformType,
      onSwapExecuted: handleSwapExecuted,
      onSuccess: handleSwapSuccess,
      onError: handleSwapError,
      quickSwap,
      state,
      usdcDenominatedSwaps,
      percentageOfSellAmountChosen: percentageOfSellAmountChosen.current,
      assetPickerType,
    });

  const priceImpact = useCalculateSwapPriceImpact({
    sellToken,
    sellTokenPriceUsd,
    buyToken,
    sellAmount,
    usdcDenominatedSwaps,
    quote: preparedQuote?.quote,
  });

  const warning = useCalculateSwapWarnings({
    sellToken,
    quoteError,
    quote: preparedQuote?.quote,
    fundGasQuote,
    sellTokenBalance,
    buyTokenBalance,
    swapPriceImpact: priceImpact,
  });

  const handleReverseTokens = React.useCallback(() => {
    let sellAmount: string | undefined;
    if (preparedQuote?.quote?.success) {
      sellAmount = formatUnits(
        BigInt(preparedQuote?.quote.buyAmount),
        buyToken?.decimals ?? 18,
      );
    }
    reverseTokens(sellAmount);
  }, [reverseTokens, preparedQuote, buyToken]);

  // Necessary to correctly pass params to the provider from web router
  const initialize = React.useCallback(
    (params: WalletSwapParams) => {
      siwfLog('initialize() called', {
        hasSwapIntent: !!params?.swapIntent,
        buyAddr: params?.swapIntent?.buy?.address,
        sellAddr: params?.swapIntent?.sell?.address,
        platformType: params?.platformType,
        hasOnSuccess: !!params?.onSuccess,
        ts: Date.now(),
      });
      setParams(params);
    },
    [setParams],
  );

  React.useEffect(() => {
    siwfLog('state transition', {
      stateState: state.state,
      txHash: state.state === 'confirmed' ? state.txHash : undefined,
      hasBuyToken: !!buyToken,
      hasSellToken: !!sellToken,
      ts: Date.now(),
    });
  }, [state, buyToken, sellToken]);

  const handleTryAgain = React.useCallback(() => {
    setState({ state: 'pending' });
  }, []);

  const setShowDetailsSheet = React.useCallback((show: boolean) => {
    setShowDetailsSheetState(show);
  }, []);

  const value: SwapTokensContextType = React.useMemo(() => {
    return {
      initialize,
      evmAddress: evmAddress!,
      solanaAddress,
      sellToken,
      setSellToken: handleSetSellToken,
      buyToken,
      setBuyToken,
      sellAmount,
      setSellAmount,
      attributedDomain: params.attributedDomain,
      platformType: params.platformType,
      onSuccess: params.onSuccess,
      onError: params.onError,
      onSwapExecuted: params.onSwapExecuted,
      preparedQuote,
      quoteError,
      allQuotes,
      reverseTokens: handleReverseTokens,
      buyTokenBalance,
      sellTokenBalance,
      isFetching,
      fundGasQuote,
      state,
      tryAgain: handleTryAgain,
      isSellExperience,
      isBuyExperience,
      sellTokenUsdBalance,
      sellTokenPriceUsd,
      buyTokenUsdBalance,
      usdcDenominatedSwaps,
      percentageOfSellAmountChosen: percentageOfSellAmountChosen.current,
      setPercentageOfSellAmountChosen,
      warning,
      showDetailsSheet,
      setShowDetailsSheet,
      assetPickerType,
      setAssetPickerType,
      priceImpact,
    } satisfies SwapTokensContextType;
  }, [
    initialize,
    evmAddress,
    solanaAddress,
    sellToken,
    handleSetSellToken,
    buyToken,
    setBuyToken,
    sellAmount,
    setSellAmount,
    params.attributedDomain,
    params.platformType,
    params.onSuccess,
    params.onError,
    params.onSwapExecuted,
    preparedQuote,
    quoteError,
    allQuotes,
    handleReverseTokens,
    buyTokenBalance,
    sellTokenBalance,
    isFetching,
    fundGasQuote,
    state,
    handleTryAgain,
    isSellExperience,
    isBuyExperience,
    sellTokenUsdBalance,
    sellTokenPriceUsd,
    buyTokenUsdBalance,
    usdcDenominatedSwaps,
    percentageOfSellAmountChosen,
    setPercentageOfSellAmountChosen,
    warning,
    showDetailsSheet,
    setShowDetailsSheet,
    assetPickerType,
    setAssetPickerType,
    priceImpact,
  ]);

  return (
    <SwapTokensContext.Provider value={value}>
      {children}
    </SwapTokensContext.Provider>
  );
}

export function useSwapTokens() {
  const context = React.useContext(SwapTokensContext);
  if (context === undefined) {
    throw new Error('useSwapTokens must be used within a SwapTokensProvider');
  }
  return context;
}

export function useOptionalSwapTokens() {
  return React.useContext(SwapTokensContext);
}
