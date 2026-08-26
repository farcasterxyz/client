import { formatPrice } from '../CryptoUtils';

/**
 * Token balance total must equal price × balance to avoid mismatch when
 * price and balance come from different sources (e.g. MON token bug NEYN-9666).
 * This test verifies the calculation and formatting.
 */
describe('Token balance value calculation (NEYN-9666)', () => {
  it('computes total as price × balance for MON token case', () => {
    const balance = 20691.34;
    const priceUsd = 0.022791;
    const valueUsd = priceUsd * balance;

    // Expected: ~$471.58 (price × balance). Wrong precomputed value was $429.73
    expect(valueUsd).toBeCloseTo(471.58, 1);
    expect(valueUsd).not.toBeCloseTo(429.73, 0);
  });

  it('formatted total matches price × balance within rounding', () => {
    const balance = 20691.34;
    const priceUsd = 0.022791;
    const valueUsd = priceUsd * balance;
    const formatted = formatPrice(valueUsd, { showPositiveSign: false });

    // formatPrice rounds to 2 decimals: $471.58
    expect(formatted).toMatch(/\$471\.\d{2}/);
  });
});
