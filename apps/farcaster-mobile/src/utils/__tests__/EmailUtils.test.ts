import { isEmailValid } from '../EmailUtils';

describe('EmailUtils', () => {
  describe('isEmailValid', () => {
    it('should validate the email', () => {
      expect(isEmailValid('')).toEqual(false);
      expect(isEmailValid('foo')).toEqual(false);
      expect(isEmailValid('foo@bar')).toEqual(false);
      expect(isEmailValid('foo@bar.com')).toEqual(true);
    });
  });
});
