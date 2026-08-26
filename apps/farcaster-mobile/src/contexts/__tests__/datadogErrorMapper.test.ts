import {
  isCancelledRequest,
  isPrivyPingTimeout,
} from '~/contexts/datadogErrorMapper';

describe('datadogErrorMapper', () => {
  describe('isPrivyPingTimeout', () => {
    it('matches the bare message and prefixed variants', () => {
      expect(isPrivyPingTimeout('Ping reached timeout')).toEqual(true);
      expect(
        isPrivyPingTimeout('[Privy] Ping reached timeout after 10s'),
      ).toEqual(true);
    });

    it('does not match unrelated messages', () => {
      expect(isPrivyPingTimeout('Network request failed')).toEqual(false);
      expect(isPrivyPingTimeout('')).toEqual(false);
    });
  });

  describe('isCancelledRequest', () => {
    const cancelledStack =
      'Error Domain=NSURLErrorDomain Code=-999 "cancelled" UserInfo={NSLocalizedDescription=cancelled}';

    it('matches the locale-stable -999 code in the stacktrace', () => {
      expect(isCancelledRequest({ stacktrace: cancelledStack })).toEqual(true);
    });

    it('does not suppress a real failure with a different NSURLErrorDomain code', () => {
      // The key safety guarantee: timeouts/offline/etc. carry a different code
      // and must still surface as errors.
      expect(
        isCancelledRequest({
          stacktrace: 'Error Domain=NSURLErrorDomain Code=-1009 "offline"',
        }),
      ).toEqual(false);
    });

    it('does not match on the localized message alone (no stacktrace fallback)', () => {
      // Message-only matching would risk suppressing unrelated errors and is
      // the only path that could fire on Android (no NSURLErrorDomain).
      expect(isCancelledRequest({ stacktrace: '' })).toEqual(false);
      expect(isCancelledRequest({})).toEqual(false);
    });
  });
});
