type SwapWarningSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type SwapWarningType =
  | 'high_price_impact_danger'
  | 'high_price_impact_warning'
  | 'market_rate_unfavorable_warning'
  | 'market_rate_unfavorable_blocked'
  | 'gas_conversion'
  | 'needs_gas'
  | 'quote_unavailable'
  | 'new_token'
  | 'coinbase_onramp_limit_explainer';

type SwapWarningBase = {
  type: SwapWarningType;
  severity: SwapWarningSeverity;
  data: unknown;
};

export interface GasConversionWarning extends SwapWarningBase {
  type: 'gas_conversion';
  severity: 'INFO';
  data: {
    conversionAmount: number;
  };
}

export interface NeedsGasWarning extends SwapWarningBase {
  type: 'needs_gas';
  severity: 'INFO';
  data: {
    nativeAssetSymbol: string;
  };
}

export interface HighPriceImpactDangerWarning extends SwapWarningBase {
  type: 'high_price_impact_danger';
  severity: 'CRITICAL';
  data: {
    priceImpact: number;
  };
}

export interface HighPriceImpactWarning extends SwapWarningBase {
  type: 'high_price_impact_warning';
  severity: 'WARNING';
  data: {
    priceImpact: number;
  };
}

export interface MarketRateUnfavorableWarning extends SwapWarningBase {
  type: 'market_rate_unfavorable_warning';
  severity: 'WARNING';
  data: {
    valueLossBps: number;
    valueLossUsd?: number;
  };
}

export interface MarketRateUnfavorableBlockedWarning extends SwapWarningBase {
  type: 'market_rate_unfavorable_blocked';
  severity: 'CRITICAL';
  data: {
    valueLossBps: number;
    valueLossUsd?: number;
  };
}

export interface QuoteUnavailableWarning extends SwapWarningBase {
  type: 'quote_unavailable';
  severity: 'INFO';
  data: undefined;
}

export interface NewTokenWarning extends SwapWarningBase {
  type: 'new_token';
  severity: 'INFO';
}

export interface CoinbaseOnrampLimitExplainerWarning extends SwapWarningBase {
  type: 'coinbase_onramp_limit_explainer';
  severity: 'INFO';
  data: undefined;
}

export type SwapWarning =
  | GasConversionWarning
  | NeedsGasWarning
  | HighPriceImpactDangerWarning
  | HighPriceImpactWarning
  | MarketRateUnfavorableWarning
  | MarketRateUnfavorableBlockedWarning
  | QuoteUnavailableWarning
  | NewTokenWarning
  | CoinbaseOnrampLimitExplainerWarning;

export function getSwapDetailsSheetWarningContent(
  warning: SwapWarning,
): string {
  switch (warning.type) {
    case 'high_price_impact_danger':
      return 'This trade has high market fees because of low liquidity, you may receive less than expected.';
    case 'high_price_impact_warning':
      return 'This trade has high market fees because of low liquidity.';
    case 'market_rate_unfavorable_warning':
      return 'This quote is unfavorable versus market value. Review details before you continue.';
    case 'market_rate_unfavorable_blocked':
      return 'This quote is too unfavorable versus market value and cannot be executed.';
    case 'gas_conversion':
      return `Converting $${warning.data.conversionAmount} USDC to cover for gas fees.`;
    case 'needs_gas':
      return 'Not enough gas to cover chain fees. Please add more gas to your transaction.';
    case 'quote_unavailable':
      return 'Quotes may be unavailable when a token has low liquidity. Orders that are very small or very large can be hard to match. To continue, try adjusting the amount you want to trade.';
    case 'new_token':
      return 'Quotes may be unavailable for new tokens because liquidity is still low. Try again later or adjust the amount you want to trade.';
    case 'coinbase_onramp_limit_explainer':
      return 'You can onramp funds without needing a Coinbase account. As a guest, you are limited to: 15 total lifetime transactions $2,500 per week (rolling 7-day window)';
  }
}

export function getSwapDetailsBackgroundColor(
  warning: SwapWarning,
): 'danger' | 'warning' | 'secondary' {
  switch (warning.severity) {
    case 'CRITICAL':
      return 'danger';
    case 'WARNING':
      return 'warning';
    case 'INFO':
      return 'secondary';
  }
}

export function getSwapDetailsTextColor(
  warning: SwapWarning,
): 'danger' | 'warning' | 'secondary' {
  switch (warning.severity) {
    case 'CRITICAL':
      return 'danger';
    case 'WARNING':
      return 'warning';
    case 'INFO':
      return 'secondary';
  }
}
