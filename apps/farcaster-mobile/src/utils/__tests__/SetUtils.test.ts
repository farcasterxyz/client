import { areSetsEqual, getSetsDiff } from '../SetUtils';

describe('SetUtils', () => {
  describe('areSetsEqual', () => {
    it('should determine whether the sets are deeply equal', () => {
      expect(areSetsEqual(new Set(), new Set())).toEqual(true);
      expect(areSetsEqual(new Set(['a']), new Set(['a']))).toEqual(true);
      expect(areSetsEqual(new Set(['a']), new Set([]))).toEqual(false);
      expect(areSetsEqual(new Set(['']), new Set(['a']))).toEqual(false);
      expect(areSetsEqual(new Set(['a', 'b']), new Set(['a']))).toEqual(false);
      expect(areSetsEqual(new Set(['a']), new Set(['a', 'b']))).toEqual(false);
      expect(areSetsEqual(new Set(['a', 'b']), new Set(['a', 'b']))).toEqual(
        true,
      );
    });
  });

  describe('getSetsDiff', () => {
    it('should return the difference between the sets', () => {
      expect(getSetsDiff(new Set(), new Set())).toEqual(new Set());
      expect(getSetsDiff(new Set(['a']), new Set(['a']))).toEqual(new Set());
      expect(getSetsDiff(new Set(['a']), new Set([]))).toEqual(new Set(['a']));
      expect(getSetsDiff(new Set([]), new Set(['a']))).toEqual(new Set(['a']));
      expect(getSetsDiff(new Set(['a', 'b']), new Set(['a']))).toEqual(
        new Set('b'),
      );
      expect(getSetsDiff(new Set(['a']), new Set(['a', 'b']))).toEqual(
        new Set('b'),
      );
      expect(getSetsDiff(new Set(['a', 'b']), new Set(['a', 'b']))).toEqual(
        new Set(),
      );
    });
  });
});
