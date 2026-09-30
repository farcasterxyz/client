import { formatDuration } from '../TimeUtils';

describe('TimeUtils', () => {
  describe('formatDuration', () => {
    it('should format the duration correctly without more', () => {
      expect(formatDuration(2 * 24 * 60 * 60 * 1000)).toEqual('2 days');
      expect(formatDuration(24 * 60 * 60 * 1000 + 1)).toEqual('2 days');
      expect(formatDuration(24 * 60 * 60 * 1000)).toEqual('24 hours');
      expect(formatDuration(60 * 60 * 1000 + 1)).toEqual('2 hours');
      expect(formatDuration(60 * 60 * 1000)).toEqual('60 minutes');
      expect(formatDuration(60 * 1000 + 1)).toEqual('2 minutes');
      expect(formatDuration(60 * 1000)).toEqual('1 minute');
      expect(formatDuration(1)).toEqual('1 minute');
    });

    it('should format the duration correctly with more', () => {
      expect(formatDuration(2 * 24 * 60 * 60 * 1000, true)).toEqual(
        '2 more days',
      );
      expect(formatDuration(24 * 60 * 60 * 1000 + 1, true)).toEqual(
        '2 more days',
      );
      expect(formatDuration(24 * 60 * 60 * 1000, true)).toEqual(
        '24 more hours',
      );
      expect(formatDuration(60 * 60 * 1000 + 1, true)).toEqual('2 more hours');
      expect(formatDuration(60 * 60 * 1000, true)).toEqual('60 more minutes');
      expect(formatDuration(60 * 1000 + 1, true)).toEqual('2 more minutes');
      expect(formatDuration(60 * 1000, true)).toEqual('1 more minute');
      expect(formatDuration(1, true)).toEqual('1 more minute');
    });
  });
});
