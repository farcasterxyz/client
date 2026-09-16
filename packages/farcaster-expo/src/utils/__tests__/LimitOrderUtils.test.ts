import {
  computeDefaultLimitOrderTargetPrice,
  decreaseByPercent,
  formatLimitOrderTargetPriceDisplay,
  formatUsdPercentageAmount,
  getDisplayMarketPriceUsd,
  getLimitOrderTargetPriceDecimals,
  increaseByPercent,
  maxSellUsdAtTargetPrice,
  sanitizeLimitOrderTargetPriceInput,
  sellUsdAmountExceedsBalance,
  usdAmountExceedsBalance,
} from '../LimitOrderUsdUtils';

describe('limit order target price decimals', () => {
  it('uses two decimals for normal prices', () => {
    expect(getLimitOrderTargetPriceDecimals(1.23)).toBe(2);
    expect(getLimitOrderTargetPriceDecimals(0.01)).toBe(2);
  });

  it('allows extra decimals for typing sub-cent prices', () => {
    expect(getLimitOrderTargetPriceDecimals(0.000002)).toBe(12);
  });

  it('uses simple percent math for defaults', () => {
    expect(decreaseByPercent(0.000002, 5)).toBeCloseTo(0.0000019, 10);
    expect(increaseByPercent(0.000002, 5)).toBeCloseTo(0.0000021, 10);
  });

  it('snaps market price to header display precision', () => {
    expect(getDisplayMarketPriceUsd(0.000002124221, 0.000002124221)).toBe(
      0.000002,
    );
  });

  it('sanitizes target price input to the allowed decimal count', () => {
    expect(sanitizeLimitOrderTargetPriceInput('0.1234567890123', 12)).toBe(
      '0.123456789012',
    );
  });

  it('formats default buy target below market for micro-cap prices', () => {
    expect(
      computeDefaultLimitOrderTargetPrice({
        currentPriceUsd: 0.000002,
        kind: 'buy',
        priceUsd: '0.000002',
      }),
    ).toBe('0.0000019');
    expect(
      Number(
        computeDefaultLimitOrderTargetPrice({
          currentPriceUsd: 0.000002,
          kind: 'buy',
          priceUsd: '0.000002',
        }),
      ),
    ).toBeLessThan(0.000002);
  });

  it('formats default sell target above market for micro-cap prices', () => {
    expect(
      computeDefaultLimitOrderTargetPrice({
        currentPriceUsd: 0.000002,
        kind: 'sell',
        priceUsd: '0.000002',
      }),
    ).toBe('0.0000021');
  });

  it('ignores hidden float precision in numeric priceUsd', () => {
    const noisyPrice = 0.000002124221;
    expect(
      computeDefaultLimitOrderTargetPrice({
        currentPriceUsd: noisyPrice,
        kind: 'buy',
        priceUsd: noisyPrice,
      }),
    ).toBe('0.0000019');
  });

  it('shows full precision while editing', () => {
    expect(
      formatLimitOrderTargetPriceDisplay(
        '0.000002123456',
        '0.000002',
        0.000002,
        { isEditing: true },
      ),
    ).toBe('0.000002123456');
  });

  it('caps display decimals to market precision plus one when idle', () => {
    expect(
      formatLimitOrderTargetPriceDisplay(
        '0.000002016844063839',
        '0.000002',
        0.000002,
      ),
    ).toBe('0.000002');
  });

  it('does not pad default prices to 18 decimals', () => {
    const formatted = computeDefaultLimitOrderTargetPrice({
      currentPriceUsd: 0.000002,
      kind: 'buy',
      priceUsd: '0.000002',
    });
    expect(formatted).toBe('0.0000019');
    expect(formatted.split('.')[1]?.length).toBeLessThanOrEqual(7);
  });
});

describe('limit order USD balance helpers', () => {
  describe('formatUsdPercentageAmount', () => {
    it('floors max to avoid rounding above balance', () => {
      expect(formatUsdPercentageAmount(14.476, 1)).toBe('14.47');
      expect(formatUsdPercentageAmount(14.479999, 1)).toBe('14.47');
    });

    it('floors partial percentages', () => {
      expect(formatUsdPercentageAmount(14.47, 0.5)).toBe('7.23');
    });
  });

  describe('usdAmountExceedsBalance', () => {
    it('allows max amount that was floored to balance', () => {
      expect(usdAmountExceedsBalance(14.47, 14.476)).toBe(false);
      expect(usdAmountExceedsBalance(14.47, 14.479999)).toBe(false);
    });

    it('rejects amounts above floored balance', () => {
      expect(usdAmountExceedsBalance(14.48, 14.476)).toBe(true);
    });

    it('allows exact two-decimal balance', () => {
      expect(usdAmountExceedsBalance(14.48, 14.48)).toBe(false);
    });
  });

  describe('sellUsdAmountExceedsBalance', () => {
    const targetPrice = 1706.77;
    const quantity = 0.008476;

    it('allows max sell amount derived from quantity at target price', () => {
      const maxUsd = maxSellUsdAtTargetPrice(quantity, targetPrice);
      expect(sellUsdAmountExceedsBalance(maxUsd, targetPrice, quantity)).toBe(
        false,
      );
    });

    it('rejects sell amount that rounds above available quantity', () => {
      expect(sellUsdAmountExceedsBalance(14.48, targetPrice, quantity)).toBe(
        true,
      );
    });
  });
});
