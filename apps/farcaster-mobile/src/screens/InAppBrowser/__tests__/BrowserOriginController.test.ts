jest.mock('../BrowserPermissionStore', () => ({
  getBrowserPermission: jest.fn(),
}));

import {
  buildBrowserSession,
  getBrowserPermissionTier,
  hasOriginChanged,
  isBlockedBrowserUrl,
  normalizeHostnameFromUrl,
  normalizeOriginFromUrl,
} from '../BrowserOriginController';
import { getBrowserPermission } from '../BrowserPermissionStore';

describe('BrowserOriginController', () => {
  beforeEach(() => {
    (getBrowserPermission as jest.Mock).mockReset();
  });

  it('normalizes exact origin', () => {
    expect(normalizeOriginFromUrl('https://example.com/some/path')).toBe(
      'https://example.com',
    );
  });

  it('normalizes hostname from domains and URLs', () => {
    expect(normalizeHostnameFromUrl('Example.com')).toBe('example.com');
    expect(normalizeHostnameFromUrl('https://Example.com/some/path')).toBe(
      'example.com',
    );
  });

  it('returns tier 0 for insecure pages', () => {
    expect(
      getBrowserPermissionTier({
        url: 'http://example.com',
      }),
    ).toBe(0);
  });

  it('returns tier 1 when no connection grant exists', () => {
    (getBrowserPermission as jest.Mock).mockReturnValue(undefined);
    expect(
      getBrowserPermissionTier({
        url: 'https://example.com',
      }),
    ).toBe(1);
  });

  it('returns tier 2 when connected but not trusted', () => {
    (getBrowserPermission as jest.Mock).mockReturnValue({
      connectGranted: true,
      trusted: false,
    });
    expect(
      getBrowserPermissionTier({
        url: 'https://example.com',
      }),
    ).toBe(2);
  });

  it('returns tier 2 for current-session authorization', () => {
    (getBrowserPermission as jest.Mock).mockReturnValue(undefined);
    expect(
      getBrowserPermissionTier({
        url: 'https://example.com',
        sessionConnectedAddress: '0x1111111111111111111111111111111111111111',
      }),
    ).toBe(2);
  });

  it('returns tier 3 when trusted', () => {
    (getBrowserPermission as jest.Mock).mockReturnValue({
      connectGranted: true,
      trusted: true,
    });
    expect(
      getBrowserPermissionTier({
        url: 'https://example.com',
      }),
    ).toBe(3);
  });

  it('keeps persisted trust above current-session authorization', () => {
    (getBrowserPermission as jest.Mock).mockReturnValue({
      connectGranted: true,
      trusted: true,
    });
    expect(
      getBrowserPermissionTier({
        url: 'https://example.com',
        sessionConnectedAddress: '0x1111111111111111111111111111111111111111',
      }),
    ).toBe(3);
  });

  it('marks session injectEnabled only for secure origin', () => {
    expect(
      buildBrowserSession({
        url: 'https://example.com',
      }).injectEnabled,
    ).toBe(true);
    expect(
      buildBrowserSession({
        url: 'http://example.com',
      }).injectEnabled,
    ).toBe(false);
  });

  it('detects cross-origin transitions', () => {
    expect(
      hasOriginChanged({
        previousUrl: 'https://example.com/a',
        nextUrl: 'https://evil.com/b',
      }),
    ).toBe(true);
  });

  it('detects blocked browser URLs by hostname', () => {
    const blockedDomains = new Set(['blocked.example']);

    expect(
      isBlockedBrowserUrl({
        url: 'https://blocked.example/path',
        blockedDomains,
      }),
    ).toBe(true);
    expect(
      isBlockedBrowserUrl({
        url: 'https://sub.blocked.example/path',
        blockedDomains,
      }),
    ).toBe(true);
    expect(
      isBlockedBrowserUrl({
        url: 'https://allowed.example/path',
        blockedDomains,
      }),
    ).toBe(false);
  });
});
