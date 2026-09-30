import { hasExtension, isAbsoluteUrl, parseUrl } from '../UrlUtils';

describe('UrlUtils', () => {
  describe('isAbsoluteUrl', () => {
    it('should determine whether a URL is absolute', () => {
      expect(isAbsoluteUrl('')).toEqual(false);
      expect(isAbsoluteUrl('foo')).toEqual(false);
      expect(isAbsoluteUrl('/foo')).toEqual(false);
      expect(isAbsoluteUrl('foo.com')).toEqual(false);
      expect(isAbsoluteUrl('www.foo.com')).toEqual(false);
      expect(isAbsoluteUrl('http://foo.com')).toEqual(true);
      expect(isAbsoluteUrl('HTTP://foo.com')).toEqual(true);
      expect(isAbsoluteUrl('https://foo.com')).toEqual(true);
      expect(isAbsoluteUrl('HTTPS://foo.com/bar')).toEqual(true);
      expect(isAbsoluteUrl('HTTP://WWW.FOO.COM')).toEqual(true);
    });
  });

  describe('parseUrl', () => {
    it('should parse valid URLs', () => {
      expect(parseUrl('foo')).toEqual(undefined);
      expect(parseUrl('/foo')).toEqual(undefined);
      expect(parseUrl('https://foo.com')).toEqual(new URL('https://foo.com'));
    });
  });

  describe('hasExtension', () => {
    it('should determine whether a URL is an absolute link to an image', () => {
      expect(hasExtension('/foo.svg', ['.svg'])).toEqual(false);
      expect(hasExtension('https://foo.com/bar.svg', ['.svg'])).toEqual(true);
      expect(hasExtension('HTTPS://WWW.FOO.COM/BAR.SVG', ['.svg'])).toEqual(
        true,
      );
    });
  });
});
