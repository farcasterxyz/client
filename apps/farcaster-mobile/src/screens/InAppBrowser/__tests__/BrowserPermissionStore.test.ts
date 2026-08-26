const mockBackingStore = new Map<string, string>();

jest.mock('~/utils/FastStorageUtils', () => ({
  getStorage: () => ({
    getString: (key: string) => mockBackingStore.get(key),
    set: (key: string, value: string) => {
      mockBackingStore.set(key, value);
    },
  }),
}));

import {
  getBrowserPermission,
  revokeBrowserPermission,
  upsertBrowserPermission,
} from '../BrowserPermissionStore';

describe('BrowserPermissionStore', () => {
  beforeEach(() => {
    mockBackingStore.clear();
  });

  it('clears connectedAddress when permission is revoked', () => {
    upsertBrowserPermission('https://app.uniswap.org', {
      connectGranted: true,
      trusted: false,
      connectedAddress: '0x1111111111111111111111111111111111111111',
    });

    revokeBrowserPermission('https://app.uniswap.org');

    const permission = getBrowserPermission('https://app.uniswap.org');

    expect(permission).toEqual(
      expect.objectContaining({
        connectGranted: false,
        trusted: false,
      }),
    );
    expect(permission?.connectedAddress).toBeUndefined();
  });
});
