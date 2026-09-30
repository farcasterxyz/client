import {
  formatCents,
  formatDecimal,
  formatDisplayDollars,
  formatWholeDollars,
} from '../utils/MoneyUtils';

describe('MoneyUtils', () => {
  describe('formatDecimal', () => {
    it('should format zero as $0.00', () => {
      expect(formatDecimal(0)).toBe('$0.00');
    });

    it('should format very small amounts as < $0.01', () => {
      expect(formatDecimal(0.001)).toBe('< $0.01');
      expect(formatDecimal(0.007)).toBe('< $0.01');
      expect(formatDecimal(0.0074)).toBe('< $0.01');
    });

    it('should format amounts >= 0.0075 normally', () => {
      expect(formatDecimal(0.0075)).toBe('$0.01');
      expect(formatDecimal(0.01)).toBe('$0.01');
      expect(formatDecimal(1.23)).toBe('$1.23');
      expect(formatDecimal(100.45)).toBe('$100.45');
      expect(formatDecimal(1234.56)).toBe('$1,234.56');
    });
  });

  describe('formatWholeDollars', () => {
    it('should format whole dollars without decimals', () => {
      expect(formatWholeDollars(0)).toBe('$0');
      expect(formatWholeDollars(1)).toBe('$1');
      expect(formatWholeDollars(100)).toBe('$100');
      expect(formatWholeDollars(1234)).toBe('$1,234');
    });

    it('should round to whole dollars', () => {
      expect(formatWholeDollars(1.4)).toBe('$1');
      expect(formatWholeDollars(1.5)).toBe('$2');
      expect(formatWholeDollars(1.9)).toBe('$2');
    });

    it('should handle negative amounts', () => {
      expect(formatWholeDollars(-1)).toBe('-$1');
      expect(formatWholeDollars(-100)).toBe('-$100');
    });
  });

  describe('formatCents', () => {
    it('should convert cents to dollars', () => {
      expect(formatCents(0)).toBe('$0.00');
      expect(formatCents(1)).toBe('$0.01');
      expect(formatCents(100)).toBe('$1.00');
      expect(formatCents(123)).toBe('$1.23');
      expect(formatCents(12345)).toBe('$123.45');
    });

    it('should handle very small cent amounts', () => {
      expect(formatCents(1)).toBe('$0.01');
      expect(formatCents(7)).toBe('$0.07');
      expect(formatCents(74)).toBe('$0.74');
    });
  });

  describe('formatDisplayDollars', () => {
    it('should format zero as $0.00', () => {
      expect(formatDisplayDollars(0)).toBe('$0.00');
    });

    it('should format very small amounts as < $0.01', () => {
      expect(formatDisplayDollars(0.001)).toBe('< $0.01');
      expect(formatDisplayDollars(0.007)).toBe('< $0.01');
      expect(formatDisplayDollars(0.0074)).toBe('< $0.01');
    });

    it('should format amounts < $10 with decimals', () => {
      expect(formatDisplayDollars(0.01)).toBe('$0.01');
      expect(formatDisplayDollars(1.23)).toBe('$1.23');
      expect(formatDisplayDollars(5.67)).toBe('$5.67');
      expect(formatDisplayDollars(9.99)).toBe('$9.99');
    });

    it('should format amounts >= $10 as whole dollars', () => {
      expect(formatDisplayDollars(10)).toBe('$10');
      expect(formatDisplayDollars(10.5)).toBe('$11');
      expect(formatDisplayDollars(100)).toBe('$100');
      expect(formatDisplayDollars(100.7)).toBe('$101');
      expect(formatDisplayDollars(1234.56)).toBe('$1,235');
    });

    it('should handle negative amounts', () => {
      expect(formatDisplayDollars(-0.001)).toBe('> -$0.01');
      expect(formatDisplayDollars(-5.67)).toBe('-$5.67');
      expect(formatDisplayDollars(-10.5)).toBe('-$11');
      expect(formatDisplayDollars(-100)).toBe('-$100');
    });

    it('should handle edge case at $10 boundary', () => {
      expect(formatDisplayDollars(9.99)).toBe('$9.99');
      expect(formatDisplayDollars(10)).toBe('$10');
      expect(formatDisplayDollars(10.01)).toBe('$10');
    });
  });
});
