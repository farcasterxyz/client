import { renderHook } from '@testing-library/react-native';
import {
  ApiOnchainSwapQuoteError,
  ApiOnchainSwapQuoteSuccess,
  ApiTokenLink,
} from 'farcaster-client-data';

import { useCalculateSwapWarnings } from '../useCalculateSwapWarnings';

jest.mock('../../../../../utils/CryptoUtils', () => ({
  __esModule: true,
  NATIVE_ASSET_SYMBOLS: {
    base: 'ETH',
  },
}));

const baseArgs = {
  sellToken: {
    chain: 'base',
  } as ApiTokenLink,
  sellTokenBalance: '0',
  buyTokenBalance: '0',
  quoteError: undefined,
  quote: undefined,
  fundGasQuote: undefined,
  swapPriceImpact: {
    sellUsdValue: 10,
    buyUsdValue: 9.4,
    priceImpact: 0.06,
    showPriceImpactWarning: false,
    showHighPriceImpactWarning: false,
  },
};

describe('useCalculateSwapWarnings', () => {
  it('returns market-rate warning when explicit acceptance is required', () => {
    const { result } = renderHook(() =>
      useCalculateSwapWarnings({
        ...baseArgs,
        quote: {
          financialImpact: {
            blocked: false,
            wouldBlock: false,
            requiresExplicitAcceptance: true,
            valueLossBps: 700,
            valueLossUsd: 1.5,
          },
        } as unknown as ApiOnchainSwapQuoteSuccess,
      }),
    );

    expect(result.current?.type).toBe('market_rate_unfavorable_warning');
    expect(result.current?.data).toMatchObject({
      valueLossBps: 700,
      valueLossUsd: 1.5,
    });
  });

  it('returns market-rate blocked warning when quote is blocked', () => {
    const { result } = renderHook(() =>
      useCalculateSwapWarnings({
        ...baseArgs,
        quoteError: {
          error: 'EXCESSIVE_VALUE_LOSS',
          message: 'blocked',
          financialImpact: {
            blocked: true,
            wouldBlock: true,
            requiresExplicitAcceptance: false,
            valueLossBps: 1200,
            valueLossUsd: 3.2,
          },
        } as unknown as ApiOnchainSwapQuoteError,
      }),
    );

    expect(result.current?.type).toBe('market_rate_unfavorable_blocked');
    expect(result.current?.data).toMatchObject({
      valueLossBps: 1200,
      valueLossUsd: 3.2,
    });
  });

  it('prioritizes high price impact danger over market-rate warning', () => {
    const { result } = renderHook(() =>
      useCalculateSwapWarnings({
        ...baseArgs,
        quote: {
          financialImpact: {
            blocked: false,
            wouldBlock: false,
            requiresExplicitAcceptance: true,
            valueLossBps: 600,
          },
        } as unknown as ApiOnchainSwapQuoteSuccess,
        swapPriceImpact: {
          ...baseArgs.swapPriceImpact,
          showHighPriceImpactWarning: true,
        },
      }),
    );

    expect(result.current?.type).toBe('high_price_impact_danger');
  });
});
