import { shouldUpdateCache } from '../utils/ObjectUtils';

describe('ObjectUtils', () => {
  describe('shouldUpdateCache', () => {
    it('should update when the cache is empty', () => {
      expect(
        shouldUpdateCache({ cache: undefined, updates: { foo: 'bar' } }),
      ).toEqual(true);
    });

    it('should update when root-level primitives are different', () => {
      expect(
        shouldUpdateCache({
          cache: { foo: 'bar' },
          updates: { foo: 'UPDATED' },
        }),
      ).toEqual(true);
    });

    it('should NOT update when root-level primitives are the same', () => {
      expect(
        shouldUpdateCache({
          cache: { foo: 'bar' },
          updates: { foo: 'bar' },
        }),
      ).toEqual(false);
    });

    it('should update when nested object values are different', () => {
      expect(
        shouldUpdateCache({
          cache: { foo: { bar: 'baz' } },
          updates: { foo: { bar: 'UPDATED' } },
        }),
      ).toEqual(true);
    });

    it('should NOT update when nested object values are the same', () => {
      expect(
        shouldUpdateCache({
          cache: { foo: { bar: 'baz' } },
          updates: { foo: { bar: 'baz' } },
        }),
      ).toEqual(false);
    });

    it('should update when nested array values are different', () => {
      expect(
        shouldUpdateCache({
          cache: { foo: ['bar'] },
          updates: { foo: ['bar', 'UPDATED'] },
        }),
      ).toEqual(true);
    });

    it('should NOT update when nested array values are the same', () => {
      expect(
        shouldUpdateCache({
          cache: { foo: ['bar'] },
          updates: { foo: ['bar'] },
        }),
      ).toEqual(false);
    });

    it('should NOT update when strings are same other than casing', () => {
      expect(
        shouldUpdateCache({
          cache: { foo: 'bar' },
          updates: { foo: 'BAR' },
        }),
      ).toEqual(false);
    });
  });
});
