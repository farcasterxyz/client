import {
  ApiOnchainSwapQuoteSuccess,
  ApiTokenLink,
} from 'farcaster-client-data';
import React from 'react';

import { parseTokenAmount } from '../../../../utils';

export function useCalculateSwapPriceImpact({
  sellToken,
  sellTokenPriceUsd,
  buyToken,
  sellAmount,
  usdcDenominatedSwaps,
  quote,
}: {
  sellToken: ApiTokenLink | undefined;
  sellTokenPriceUsd?: number;
  buyToken: ApiTokenLink | undefined;
  sellAmount: string;
  usdcDenominatedSwaps: boolean;
  quote: ApiOnchainSwapQuoteSuccess | undefined;
}) {
  const priceImpact = React.useMemo(() => {
    let sellUsdValue = 0;
    let buyUsdValue = 0;
    let showPriceImpactWarning = false;
    let showHighPriceImpactWarning = false;
    let priceImpact = 0;
    let priceImpactUsd = 0;

    if (sellToken && sellAmount) {
      if (usdcDenominatedSwaps) {
        sellUsdValue = parseFloat(sellAmount);
      } else {
        sellUsdValue = parseFloat(sellAmount) * (sellTokenPriceUsd ?? 0);
      }
    }

    if (buyToken && quote) {
      const sellUsdAmount =
        parseTokenAmount(quote.sellAmount, sellToken?.decimals ?? 18) *
        (sellTokenPriceUsd ?? 0);

      // A bit of a hack to help with loading state
      const isQuoteForSellAmount = usdcDenominatedSwaps
        ? Math.abs(sellUsdAmount - parseFloat(sellAmount)) < 1
        : true;
      if (isQuoteForSellAmount) {
        buyUsdValue =
          parseTokenAmount(quote.buyAmount, buyToken.decimals ?? 18) *
          parseFloat(buyToken.priceUsd ?? '0');
        priceImpactUsd = buyUsdValue - sellUsdValue;
        priceImpact = (buyUsdValue - sellUsdValue) / sellUsdValue;
        showPriceImpactWarning = priceImpact < -0.1;
        showHighPriceImpactWarning = priceImpact < -0.3;
      }
    }
    return {
      sellUsdValue,
      buyUsdValue,
      priceImpact: Math.abs(priceImpact),
      priceImpactUsd: Math.abs(priceImpactUsd),
      showPriceImpactWarning,
      showHighPriceImpactWarning,
    };
  }, [
    sellToken,
    sellTokenPriceUsd,
    sellAmount,
    buyToken,
    quote,
    usdcDenominatedSwaps,
  ]);

  return priceImpact;
}
