import { buildGoogleFaviconUrl, getDomain } from '../FaviconUtils';

describe('FaviconUtils', () => {
  describe('getDomain', () => {
    it('should parse web origins and bare domains', () => {
      expect(getDomain('https://www.example.com/path')).toEqual(
        'www.example.com',
      );
      expect(getDomain('example.com')).toEqual('example.com');
      expect(getDomain('  HTTP://EXAMPLE.COM/foo  ')).toEqual('example.com');
    });

    it('should reject non-web origins and invalid URLs', () => {
      expect(getDomain('')).toEqual(null);
      expect(getDomain('null')).toEqual(null);
      expect(getDomain('about:blank')).toEqual(null);
      expect(getDomain('file:///tmp/favicon.ico')).toEqual(null);
      expect(getDomain('not a url')).toEqual(null);
    });
  });

  describe('buildGoogleFaviconUrl', () => {
    it('should encode the domain query parameter', () => {
      expect(buildGoogleFaviconUrl('example.com?x=1&sz=128')).toEqual(
        'https://www.google.com/s2/favicons?domain=example.com%3Fx%3D1%26sz%3D128&sz=32',
      );
    });
  });
});
