import { describe, expect, test } from 'vitest';

import { compactApiClientOptions } from '../FarcasterApiClientProvider';

describe('compactApiClientOptions', () => {
  test('strips undefined entries so absent provider props cannot clear apiClient options', () => {
    // The regression this guards: FarcasterApiClient.updateOptions treats a
    // present-but-undefined key as an intentional clear. Mobile does not pass
    // `onError` to the provider (useRevokedTokenSignOutHandler installs it
    // directly on the apiClient), so the provider effect re-running — e.g.
    // when meta changes as the wallet address or deviceId resolves — must not
    // send `onError: undefined` and wipe the installed global 401 handler.
    const compacted = compactApiClientOptions({
      baseUrl: 'https://api.example.com',
      meta: { deviceId: 'device-123' },
      onError: undefined,
      onSuccess: undefined,
      isOffline: undefined,
    });

    expect(Object.prototype.hasOwnProperty.call(compacted, 'onError')).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(compacted, 'onSuccess')).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(compacted, 'isOffline')).toBe(
      false,
    );
    expect(compacted.baseUrl).toBe('https://api.example.com');
    expect(compacted.meta).toEqual({ deviceId: 'device-123' });
  });

  test('preserves defined falsy values (false, 0, empty string)', () => {
    const compacted = compactApiClientOptions({
      debug: false,
      mutateTimeout: 0,
      isOffline: false,
    });

    expect(compacted.debug).toBe(false);
    expect(compacted.mutateTimeout).toBe(0);
    expect(compacted.isOffline).toBe(false);
  });
});
