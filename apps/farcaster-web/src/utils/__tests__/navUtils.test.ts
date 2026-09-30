import { arePathsRelated } from '~/utils/navUtils';

describe('navUtils', () => {
  describe('arePathsRelated', () => {
    it('should determine if paths are related', () => {
      expect(arePathsRelated('/', '/')).toEqual(true);
      expect(arePathsRelated('/', '/bob')).toEqual(false);
      expect(arePathsRelated('/', '/~/debug')).toEqual(false);
      expect(arePathsRelated('/~/download', '/~/notifications')).toEqual(false);
      expect(arePathsRelated('/~/download', '/~/download')).toEqual(true);
      expect(arePathsRelated('/bob', '/bob')).toEqual(true);
      expect(arePathsRelated('/bob', '/not-bob')).toEqual(false);
      expect(arePathsRelated('/bob', '/bob/casts')).toEqual(true);
      expect(arePathsRelated('/bob/casts', '/bob/casts/1')).toEqual(true);

      expect(
        arePathsRelated('/bob/casts', '/bob/casts/1/some-other-param'),
      ).toEqual(true);

      expect(
        arePathsRelated(
          '/bob/casts',
          '/bob/casts/1/some-other-path-segment?query-param=val',
        ),
      ).toEqual(true);
    });
  });
});
