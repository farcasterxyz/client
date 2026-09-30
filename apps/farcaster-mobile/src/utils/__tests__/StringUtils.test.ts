import { safeStringify, splice } from '../StringUtils';

describe('StringUtils', () => {
  describe('safeStringify', () => {
    it('should stringify a string', () => {
      expect(safeStringify('foo')).toEqual('"foo"');
    });

    it('should stringify an object', () => {
      expect(safeStringify({ foo: 'bar' })).toEqual('{"foo":"bar"}');
    });

    it('should stringify null', () => {
      expect(safeStringify(null)).toEqual('null');
    });

    it('should stringify undefined (as null)', () => {
      expect(safeStringify(undefined)).toEqual('null');
    });
  });

  describe('splice', () => {
    it('should replace text in a string', () => {
      expect(splice('@goodmorning', 1, 12, 'gm')).toEqual('@gm');
      expect(splice('hello @goodmorning', 7, 18, 'gm')).toEqual('hello @gm');
      expect(splice('hello @goodmorning!', 7, 18, 'gm')).toEqual('hello @gm!');
    });
  });
});
