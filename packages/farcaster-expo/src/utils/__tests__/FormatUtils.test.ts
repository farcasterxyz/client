import { formatValue } from '../FormatUtils';

describe('formatValue()', () => {
  it('returns undefined for non-numeric strings', () => {
    expect(formatValue('foo' as unknown as string)).toBeUndefined();
  });

  it('formats small integers without decimals', () => {
    // <1000 so no thousands separator
    expect(formatValue(123)).toBe('123');
    // Using custom threshold for larger numbers (default is 6)
    expect(formatValue(987654321, 4, false, 10)).toBe('987654321');
  });

  it('pads/truncates fractional numbers to 4 decimals by default', () => {
    expect(formatValue(1.2, 4, true)).toBe('1.2000');
    expect(formatValue(1.23456)).toBe('1.2346'); // rounded
    expect(formatValue(3.31956248346786)).toBe('3.3196'); // many decimals
    expect(formatValue('9999999999.9999999999')).toBe('10B'); // Very large with decimals
  });

  it('always shows decimals when requested', () => {
    expect(formatValue(123, 2, true)).toBe('123.00');
    expect(formatValue(3.31956248346786, 6, true)).toBe('3.319562');
  });

  it('parses numeric strings', () => {
    expect(formatValue('1.23', 4, true)).toBe('1.2300');
    expect(formatValue('3.31956248346786')).toBe('3.3196');
  });

  it('uses different magnitude thresholds', () => {
    // Default threshold is 6, so numbers >=1,000,000 use exponential
    expect(formatValue(1000000)).toBe('1M');
    // With custom threshold of 9, numbers >=1,000,000,000 use exponential
    expect(formatValue(1000000, 4, false, 9)).toBe('1000000');
    expect(formatValue(1000000000, 4, false, 9)).toBe('1B');
  });

  it('handles zero values', () => {
    expect(formatValue(0)).toBe('0');
    expect(formatValue(0, 2, true)).toBe('0.00');
  });

  it('handles very small numbers', () => {
    // Numbers below 10^-magnitudeThreshold should use decimal notation
    expect(formatValue(0.0000001)).toBe('0.0000001');
    expect(formatValue(0.0000001, 2)).toBe('0.0000001');
  });

  it('handles bigint values', () => {
    expect(formatValue(0n)).toBe('0');
    // Using custom threshold for larger bigints
    expect(formatValue(123456789n, 4, false, 10)).toBe('123456789');

    // Default threshold is 6, so bigints with >6 digits use exponential
    const bigIntJustOverThreshold = BigInt('1234567');
    expect(formatValue(bigIntJustOverThreshold)).toBe('1.2345e+6');

    // With custom threshold of 10
    expect(formatValue(bigIntJustOverThreshold, 4, false, 10)).toBe('1234567');

    // Test with very large bigint
    const hugeNum = BigInt('9'.repeat(20));
    expect(formatValue(hugeNum)).toBe('9.9999e+19');

    // Test with negative bigint
    expect(formatValue(-123456789n, 4, false, 10)).toBe('-123456789');
    expect(formatValue(-BigInt('1' + '0'.repeat(10)))).toBe('-1.0000e+10');
  });

  it('handles simple rounding', () => {
    // Simple whole number rounding with decimals shown
    expect(formatValue(1.0, 1, true)).toBe('1.0');
    expect(formatValue(1.5, 1, true)).toBe('1.5');
  });

  it('clamps astronomically large values to the last known suffix instead of "undefined"', () => {
    // Permit2 max allowance (uint160 max ≈ 1.46e48). Previously this rendered
    // as `1undefined` because the suffix lookup fell off the end of the
    // suffixes array; now we clamp to the final suffix (Qi).
    const permit2Max = 1.4615016373309029e48;
    const formatted = formatValue(permit2Max, 0);
    expect(formatted).not.toContain('undefined');
    expect(formatted).toMatch(/Qi$/);

    // Bigger still (uint256 max) must also avoid the broken "undefined" suffix.
    const uint256Max = 1.157920892373162e77;
    expect(formatValue(uint256Max, 0)).not.toContain('undefined');
  });
});
