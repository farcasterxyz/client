import { removeOldTimestamps } from '~/utils/timeUtils';

describe('timeUtils', () => {
  describe('removeOldTimestamps', () => {
    it('should remove old timestamps', () => {
      const ex1 = [0, 1, 2, 3, 4];
      removeOldTimestamps({ sortedTimestamps: ex1, threshold: 2 });
      expect(ex1).toEqual([2, 3, 4]);

      const ex2 = [0, 1, 2, 3, 4];
      removeOldTimestamps({ sortedTimestamps: ex2, threshold: 1.5 });
      expect(ex2).toEqual([2, 3, 4]);

      const ex3 = [0, 1, 2, 3, 4];
      removeOldTimestamps({ sortedTimestamps: ex3, threshold: 4 });
      expect(ex3).toEqual([4]);

      const ex4 = [0, 1, 2, 3, 4];
      removeOldTimestamps({ sortedTimestamps: ex4, threshold: 5 });
      expect(ex4).toEqual([]);

      const ex5 = [0, 1, 2, 3, 4];
      removeOldTimestamps({ sortedTimestamps: ex5, threshold: -1 });
      expect(ex5).toEqual([0, 1, 2, 3, 4]);
    });
  });
});
