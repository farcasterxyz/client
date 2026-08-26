import {
  ApiOnchainSwapQuoteError,
  ApiOnchainSwapQuoteSuccess,
  ApiSwapQuote,
  ApiTokenLink,
} from 'farcaster-client-data';
import { useMemo } from 'react';

import { NATIVE_ASSET_SYMBOLS } from '../../../../utils/CryptoUtils';
import { SwapWarning } from '../../../../utils/SwapWarnings';

export function useCalculateSwapWarnings({
  sellToken,
  quoteError,
  quote,
  fundGasQuote,
  swapPriceImpact,
}: {
  sellToken: ApiTokenLink | undefined;
  sellTokenBalance: string | undefined;
  buyTokenBalance: string | undefined;
  quoteError: ApiOnchainSwapQuoteError | undefined;
  quote: ApiOnchainSwapQuoteSuccess | undefined;
  fundGasQuote: ApiSwapQuote | undefined;
  swapPriceImpact: {
    sellUsdValue: number;
    buyUsdValue: number;
    priceImpact: number;
    showPriceImpactWarning: boolean;
    showHighPriceImpactWarning: boolean;
  };
}): SwapWarning | undefined {
  const showGasConversion = !!fundGasQuote;
  const marketRateWarning =
    quote?.financialImpact ??
    (
      quoteError as
        | (ApiOnchainSwapQuoteError & {
            financialImpact?: ApiOnchainSwapQuoteSuccess['financialImpact'];
          })
        | undefined
    )?.financialImpact;
  const showQuoteUnavailable =
    quoteError &&
    quoteError.error !== 'INVALID_AMOUNT' &&
    quoteError.error !== 'NEEDS_GAS';
  const needGas = quoteError && quoteError.error === 'NEEDS_GAS';

  const { priceImpact, showPriceImpactWarning, showHighPriceImpactWarning } =
    swapPriceImpact;

  const warning: SwapWarning | undefined = useMemo(() => {
    if (showHighPriceImpactWarning) {
      return {
        type: 'high_price_impact_danger',
        severity: 'CRITICAL',
        data: {
          priceImpact: priceImpact,
        },
      };
    }
    if (showPriceImpactWarning) {
      return {
        type: 'high_price_impact_warning',
        severity: 'WARNING',
        data: {
          priceImpact: priceImpact,
        },
      };
    }
    if (marketRateWarning?.blocked || marketRateWarning?.wouldBlock) {
      return {
        type: 'market_rate_unfavorable_blocked',
        severity: 'CRITICAL',
        data: {
          valueLossBps: marketRateWarning.valueLossBps ?? 0,
          valueLossUsd: marketRateWarning.valueLossUsd,
        },
      };
    }
    if (marketRateWarning?.requiresExplicitAcceptance) {
      return {
        type: 'market_rate_unfavorable_warning',
        severity: 'WARNING',
        data: {
          valueLossBps: marketRateWarning.valueLossBps ?? 0,
          valueLossUsd: marketRateWarning.valueLossUsd,
        },
      };
    }
    if (showGasConversion) {
      return {
        type: 'gas_conversion',
        severity: 'INFO',
        data: {
          conversionAmount: 1,
        },
      };
    }
    if (showQuoteUnavailable) {
      return {
        type: 'quote_unavailable',
        severity: 'INFO',
        data: undefined,
      };
    }
    if (needGas) {
      return {
        type: 'needs_gas',
        severity: 'INFO',
        data: {
          nativeAssetSymbol: sellToken?.chain
            ? NATIVE_ASSET_SYMBOLS[sellToken?.chain]
            : 'Unknown',
        },
      };
    }

    return undefined;
  }, [
    showPriceImpactWarning,
    showHighPriceImpactWarning,
    priceImpact,
    marketRateWarning,
    sellToken,
    needGas,
    showGasConversion,
    showQuoteUnavailable,
  ]);

  return warning;
}
