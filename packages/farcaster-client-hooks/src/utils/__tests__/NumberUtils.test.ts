import { formatNumber } from '../NumberUtils';

describe('NumberUtils', () => {
  describe('formatNumber', () => {
    it('should format the number correctly', () => {
      expect(formatNumber(1)).toEqual('1');
      expect(formatNumber(12)).toEqual('12');
      expect(formatNumber(123)).toEqual('123');
      expect(formatNumber(1234)).toEqual('1,234');
      expect(formatNumber(12345)).toEqual('12,345');
      expect(formatNumber(123456)).toEqual('123,456');
      expect(formatNumber(1234567)).toEqual('1,234,567');
      expect(formatNumber(12345678)).toEqual('12,345,678');
      expect(formatNumber(123456789)).toEqual('123,456,789');
      expect(formatNumber(1234567890)).toEqual('1,234,567,890');

      expect(formatNumber(0.1234)).toEqual('0.1234');
      expect(formatNumber(12345.12345)).toEqual('12,345.12345');
    });
  });
});
