import { isUsernameValid } from '../RegistrationUtils';

describe('RegistrationUtils', () => {
  describe('isUsernameValid', () => {
    it('should validate the username', () => {
      expect(isUsernameValid('')).toEqual(false);
      expect(isUsernameValid('foo bar')).toEqual(false);
      expect(isUsernameValid('foo_bar')).toEqual(false);
      expect(isUsernameValid('foo-bar')).toEqual(true);
      expect(isUsernameValid('@foo')).toEqual(false);
      expect(isUsernameValid('foo')).toEqual(true);
    });
  });
});
