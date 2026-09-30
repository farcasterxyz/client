import { validateEnsName } from '../ProfileUtils';

describe('ProfileUtils', () => {
  describe('validateEnsName', () => {
    const expectValid = (name: string) =>
      expect(validateEnsName(name)).toMatchObject({ valid: true });
    const expectInvalid = (name: string) =>
      expect(validateEnsName(name)).toMatchObject({ valid: false });

    it('should return true for a valid ENS name', () => {
      expectValid('a.eth');
      expectValid('ab.eth');
      expectValid('abcdefgh-ijklmno.eth');
      expectValid('abcdefgh-ijklmn-.eth');
    });

    it('should return false when the ENS name is too long', () => {
      expectInvalid('abcdefgh-ijklmnop.eth');
    });

    it('should return false when the ENS name is empty', () => {
      expectInvalid('.eth');
    });

    it('should return false when the ENS name does not end in .eth', () => {
      expectInvalid('name.btc');
      expectInvalid('name-eth');
      expectInvalid('nameeth');
    });

    it('should return false when the ENS contains a dot', () => {
      expectInvalid('sub.name.eth');
    });

    it('should return false when the ENS contains starts with a dash', () => {
      expectInvalid('-name.eth');
    });
  });
});
