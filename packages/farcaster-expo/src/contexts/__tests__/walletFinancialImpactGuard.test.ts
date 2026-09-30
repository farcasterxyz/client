import {
  assertFinancialImpactAllowed,
  FinancialImpactBlockedError,
  getQuoteAcceptanceStateKey,
} from '../walletFinancialImpactGuard';

type FinancialImpactShape = {
  status: 'ok' | 'excessive_loss' | 'unavailable';
  blocked: boolean;
  wouldBlock: boolean;
  requiresExplicitAcceptance: boolean;
  warnThresholdBps: number;
  blockThresholdBps: number;
  minNotionalUsd: number;
  maxPriceAgeMs: number;
  evaluatedAtMs: number;
  reason?: string;
  valueLossBps?: number;
};

function buildMetadata({
  financialImpact,
  buyAmount = '9400000',
  accepted = false,
  acceptedIdentifier,
  acceptedBuyAmount,
  quoteId,
  sourceId = 'source-1',
  buyChain = 'base',
  buyTokenPriceUsd = 1,
  sellTokenPriceUsd = 1,
  requestSellPriceUsd = 1,
}: {
  financialImpact?: FinancialImpactShape;
  buyAmount?: string;
  accepted?: boolean;
  acceptedIdentifier?: string;
  acceptedBuyAmount?: string;
  quoteId?: string;
  sourceId?: string;
  buyChain?: string;
  buyTokenPriceUsd?: number;
  sellTokenPriceUsd?: number;
  requestSellPriceUsd?: number;
} = {}) {
  return {
    type: 'swap-v2',
    request: {
      source: '0x',
      sellChain: 'base',
      sellToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      sellAmount: '10000000',
      sellDecimals: 6,
      buyChain,
      buyToken: '0x1111111111111111111111111111111111111111',
      buyDecimals: 6,
      taker: '0xabc',
      recipient: '0xabc',
      sellPriceUsd: requestSellPriceUsd,
      nativePriceUsd: 2500,
    },
    quote: {
      success: true,
      source: '0x',
      actions: [] as never[],
      sellAmount: '10000000',
      buyAmount,
      fees: {
        source: { value: 0, percentage: 0 },
        protocol: { value: 0, percentage: 0 },
        app: { value: 0, percentage: 0 },
      },
      sourceId,
      id: quoteId,
      financialImpact,
    },
    sellToken: {
      chain: 'base',
      ca: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      imageUrl: '',
      priceUsd: sellTokenPriceUsd,
    },
    buyToken: {
      chain: 'base',
      ca: '0x1111111111111111111111111111111111111111',
      name: 'Mock Token',
      symbol: 'MOCK',
      decimals: 6,
      imageUrl: '',
      priceUsd: buyTokenPriceUsd,
    },
    userAcceptedBadQuote: accepted,
    acceptedQuoteSourceId: acceptedIdentifier,
    acceptedQuoteBuyAmount: acceptedBuyAmount,
  };
}

describe('walletFinancialImpactGuard', () => {
  it('allows non swap-v2 metadata', () => {
    expect(() =>
      assertFinancialImpactAllowed({
        type: 'send',
      }),
    ).not.toThrow();
  });

  it('allows swaps when backend financial impact is absent', () => {
    const metadata = buildMetadata({
      financialImpact: undefined,
    });

    expect(() => assertFinancialImpactAllowed(metadata)).not.toThrow();
  });

  it('blocks warning-tier local quotes until explicitly accepted', () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const metadata = buildMetadata({
      financialImpact: {
        status: 'ok',
        blocked: false,
        wouldBlock: false,
        requiresExplicitAcceptance: true,
        warnThresholdBps: 500,
        blockThresholdBps: 1000,
        minNotionalUsd: 5,
        maxPriceAgeMs: 600000,
        evaluatedAtMs: now,
      },
    });

    expect(() => assertFinancialImpactAllowed(metadata)).toThrow(
      FinancialImpactBlockedError,
    );
    expect(() => assertFinancialImpactAllowed(metadata)).toThrow(
      'explicitly accept the unfavorable market-rate warning',
    );

    jest.restoreAllMocks();
  });

  it('allows warning-tier quote after explicit acceptance when quote is unchanged', () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const metadata = buildMetadata({
      financialImpact: {
        status: 'ok',
        blocked: false,
        wouldBlock: false,
        requiresExplicitAcceptance: true,
        warnThresholdBps: 500,
        blockThresholdBps: 1000,
        minNotionalUsd: 5,
        maxPriceAgeMs: 600000,
        evaluatedAtMs: now,
      },
      accepted: true,
      acceptedIdentifier: 'source-1',
      acceptedBuyAmount: '9400000',
    });

    expect(() => assertFinancialImpactAllowed(metadata)).not.toThrow();
    jest.restoreAllMocks();
  });

  it('blocks when accepted warning quote changes after acceptance', () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const metadata = buildMetadata({
      financialImpact: {
        status: 'ok',
        blocked: false,
        wouldBlock: false,
        requiresExplicitAcceptance: true,
        warnThresholdBps: 500,
        blockThresholdBps: 1000,
        minNotionalUsd: 5,
        maxPriceAgeMs: 600000,
        evaluatedAtMs: now,
      },
      accepted: true,
      acceptedIdentifier: 'other-source',
      acceptedBuyAmount: '9400000',
    });

    expect(() => assertFinancialImpactAllowed(metadata)).toThrow(
      'Quote changed after warning acceptance',
    );
    jest.restoreAllMocks();
  });

  it('blocks when accepted warning quote is missing acceptance identifiers', () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const metadata = buildMetadata({
      financialImpact: {
        status: 'ok',
        blocked: false,
        wouldBlock: false,
        requiresExplicitAcceptance: true,
        warnThresholdBps: 500,
        blockThresholdBps: 1000,
        minNotionalUsd: 5,
        maxPriceAgeMs: 600000,
        evaluatedAtMs: now,
      },
      accepted: true,
    });

    expect(() => assertFinancialImpactAllowed(metadata)).toThrow(
      'Quote acceptance is incomplete',
    );
    jest.restoreAllMocks();
  });

  it('blocks when accepted warning quote has empty-string acceptance identifiers', () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const metadata = buildMetadata({
      financialImpact: {
        status: 'ok',
        blocked: false,
        wouldBlock: false,
        requiresExplicitAcceptance: true,
        warnThresholdBps: 500,
        blockThresholdBps: 1000,
        minNotionalUsd: 5,
        maxPriceAgeMs: 600000,
        evaluatedAtMs: now,
      },
      accepted: true,
      acceptedIdentifier: '',
      acceptedBuyAmount: '',
    });

    expect(() => assertFinancialImpactAllowed(metadata)).toThrow(
      'Quote acceptance is incomplete',
    );
    jest.restoreAllMocks();
  });

  it('allows stale backend impact when local validation cannot run and backend did not mark it dangerous', () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const metadata = buildMetadata({
      financialImpact: {
        status: 'ok',
        blocked: false,
        wouldBlock: false,
        requiresExplicitAcceptance: false,
        warnThresholdBps: 500,
        blockThresholdBps: 1000,
        minNotionalUsd: 5,
        maxPriceAgeMs: 60000,
        evaluatedAtMs: now - 120000,
      },
    });
    metadata.sellToken.priceUsd = 0;
    metadata.buyToken.priceUsd = 0;

    expect(() => assertFinancialImpactAllowed(metadata)).not.toThrow();
    jest.restoreAllMocks();
  });

  it('prefers request sell price for non-native sells when token price is unavailable', () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const metadata = buildMetadata({
      financialImpact: {
        status: 'ok',
        blocked: false,
        wouldBlock: false,
        requiresExplicitAcceptance: true,
        warnThresholdBps: 500,
        blockThresholdBps: 1000,
        minNotionalUsd: 5,
        maxPriceAgeMs: 600000,
        evaluatedAtMs: now,
      },
      sellTokenPriceUsd: 0,
      requestSellPriceUsd: 1,
    });

    expect(() => assertFinancialImpactAllowed(metadata)).toThrow(
      FinancialImpactBlockedError,
    );

    try {
      assertFinancialImpactAllowed(metadata);
    } catch (error) {
      const typedError = error as FinancialImpactBlockedError;
      expect(typedError.financialImpact?.sellPriceUsd).toBe(1);
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('accepts quotes against quote.id when sourceId is absent', () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const metadata = buildMetadata({
      financialImpact: {
        status: 'ok',
        blocked: false,
        wouldBlock: false,
        requiresExplicitAcceptance: true,
        warnThresholdBps: 500,
        blockThresholdBps: 1000,
        minNotionalUsd: 5,
        maxPriceAgeMs: 600000,
        evaluatedAtMs: now,
      },
      accepted: true,
      quoteId: 'quote-123',
      sourceId: undefined,
      acceptedIdentifier: 'quote-123',
      acceptedBuyAmount: '9400000',
    });

    expect(() => assertFinancialImpactAllowed(metadata)).not.toThrow();
    jest.restoreAllMocks();
  });

  it('uses token_data as buy price source for cross-chain native buys', () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const metadata = buildMetadata({
      financialImpact: {
        status: 'ok',
        blocked: false,
        wouldBlock: false,
        requiresExplicitAcceptance: true,
        warnThresholdBps: 500,
        blockThresholdBps: 1000,
        minNotionalUsd: 5,
        maxPriceAgeMs: 600000,
        evaluatedAtMs: now,
      },
      buyChain: 'ethereum',
      buyTokenPriceUsd: 0.94,
    });
    metadata.request.buyToken = '0x0000000000000000000000000000000000000000';

    try {
      assertFinancialImpactAllowed(metadata);
      throw new Error('Expected FinancialImpactBlockedError');
    } catch (error) {
      expect(error).toBeInstanceOf(FinancialImpactBlockedError);
      const typedError = error as FinancialImpactBlockedError;
      expect(typedError.financialImpact?.buyPriceSource).toBe('token_data');
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('tracks market-rate acceptance state with buyAmount changes', () => {
    expect(
      getQuoteAcceptanceStateKey({
        source: '0x',
        sourceId: 'source-1',
        buyAmount: '100',
      }),
    ).toBe('source-1:100');

    expect(
      getQuoteAcceptanceStateKey({
        source: '0x',
        sourceId: 'source-1',
        buyAmount: '101',
      }),
    ).toBe('source-1:101');
  });
});
