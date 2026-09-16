import { getMimeType } from '../MimeTypeUtils';

describe('MimeTypeUtils', () => {
  describe('getMimeType', () => {
    it('should return the mimetype', () => {
      expect(getMimeType('https://example.com/foo.png')).toEqual('image/png');
      expect(getMimeType('https://example.com/foo.jpeg')).toEqual('image/jpeg');
      expect(getMimeType('https://example.com/foo.jpg')).toEqual('image/jpeg');
      expect(getMimeType('foo.svg')).toEqual('image/svg+xml');
      expect(getMimeType('foo.gif')).toEqual('image/gif');
      expect(getMimeType('foo.')).toEqual(undefined);
      expect(getMimeType('foo')).toEqual(undefined);
    });
  });
});
