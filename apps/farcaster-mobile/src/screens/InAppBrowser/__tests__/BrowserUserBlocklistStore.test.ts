const mockBackingStore = new Map<string, string>();

jest.mock('~/utils/FastStorageUtils', () => ({
  getStorage: () => ({
    getString: (key: string) => mockBackingStore.get(key),
    set: (key: string, value: string) => {
      mockBackingStore.set(key, value);
    },
  }),
}));

jest.mock('~/utils/ErrorUtils', () => ({
  trackError: jest.fn(),
}));

import {
  blockDomain,
  getUserBlockedDomainForHostname,
  getUserBlockedDomains,
  isDomainUserBlocked,
  unblockDomain,
} from '../BrowserUserBlocklistStore';

const STORAGE_KEY = 'browser_user_blocklist.v1';

describe('BrowserUserBlocklistStore', () => {
  beforeEach(() => {
    mockBackingStore.clear();
    jest.clearAllMocks();
  });

  it('stores normalized domains and matches subdomains', () => {
    blockDomain('Example.com');
    blockDomain(' example.com ');

    expect(getUserBlockedDomains()).toEqual(['example.com']);
    expect(isDomainUserBlocked('example.com')).toBe(true);
    expect(getUserBlockedDomainForHostname('sub.example.com')).toBe(
      'example.com',
    );

    unblockDomain('sub.example.com');

    expect(getUserBlockedDomains()).toEqual([]);
  });

  it('ignores invalid stored JSON and recovers on next write', () => {
    mockBackingStore.set(STORAGE_KEY, '{not valid json');

    expect(getUserBlockedDomains()).toEqual([]);

    blockDomain('Example.com');

    expect(getUserBlockedDomains()).toEqual(['example.com']);
  });

  it('ignores non-array stored values and normalizes array entries', () => {
    mockBackingStore.set(
      STORAGE_KEY,
      JSON.stringify({ domain: 'example.com' }),
    );

    expect(getUserBlockedDomains()).toEqual([]);

    mockBackingStore.set(
      STORAGE_KEY,
      JSON.stringify(['Example.com', 42, ' example.com ', null, 'sub.test']),
    );

    expect(getUserBlockedDomains()).toEqual(['example.com', 'sub.test']);
  });
});
