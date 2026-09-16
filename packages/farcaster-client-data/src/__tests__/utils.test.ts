import { mergeIntoDefaultOptions } from '../utils';

describe('utils', () => {
  describe('mergeIntoDefaultOptions', () => {
    it('should merge options into defaults', () => {
      expect(
        mergeIntoDefaultOptions({
          defaults: { a: 'ant', b: 'bat' },
          options: { c: 'cat' },
        }),
      ).toEqual({ a: 'ant', b: 'bat', c: 'cat' });

      expect(
        mergeIntoDefaultOptions({
          defaults: { a: 'ant', b: 'bat' },
          options: { b: 'bear' },
        }),
      ).toEqual({ a: 'ant', b: 'bear' });

      expect(
        mergeIntoDefaultOptions({
          defaults: { a: 'ant', b: 'bat' },
          options: { b: undefined },
        }),
      ).toEqual({ a: 'ant', b: 'bat' });
    });
  });
});
