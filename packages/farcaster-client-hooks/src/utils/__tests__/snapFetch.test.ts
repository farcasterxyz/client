import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPendingSnapFetchResult,
  buildSnapCacheKey,
  buildSnapGetPayload,
  buildSnapSurface,
  cacheKeyMatchesUrl,
  createSnapFetchCache,
  isLocalhostUrl,
  readSnapFetchCacheEntry,
  shouldUseProxyFetch,
  updateSnapFetchCacheEntry,
  writeSnapFetchCacheEntry,
} from '../snapFetch';

describe('snapFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isLocalhostUrl', () => {
    it('matches loopback hosts over http and https', () => {
      expect(isLocalhostUrl('http://localhost:8787/snap')).toBe(true);
      expect(isLocalhostUrl('https://localhost:8443/snap')).toBe(true);
      expect(isLocalhostUrl('https://127.0.0.1:8443/snap')).toBe(true);
      expect(isLocalhostUrl('https://[::1]:8443/snap')).toBe(true);
    });

    it('matches the Android emulator host loopback (10.0.2.2)', () => {
      expect(isLocalhostUrl('http://10.0.2.2:8787/snap')).toBe(true);
      expect(isLocalhostUrl('https://10.0.2.2:8443/snap')).toBe(true);
    });

    it('does not match non-loopback URLs or invalid URLs', () => {
      expect(isLocalhostUrl('https://example.com/snap')).toBe(false);
      expect(isLocalhostUrl('not a url')).toBe(false);
      // Looks similar to 10.0.2.2 but is not it.
      expect(isLocalhostUrl('https://10.0.2.3/snap')).toBe(false);
    });
  });

  describe('shouldUseProxyFetch', () => {
    it('bypasses the proxy for loopback hosts regardless of protocol', () => {
      expect(shouldUseProxyFetch('http://localhost:8787/snap', 1)).toBe(false);
      expect(shouldUseProxyFetch('https://localhost:8443/snap', 1)).toBe(false);
      expect(shouldUseProxyFetch('https://[::1]:8443/snap', 1)).toBe(false);
    });

    it('uses the proxy for non-local URLs with a valid viewer fid', () => {
      expect(shouldUseProxyFetch('https://example.com/snap', 1)).toBe(true);
    });

    it('does not use the proxy for remote http URLs or invalid URLs', () => {
      expect(shouldUseProxyFetch('http://example.com/snap', 1)).toBe(false);
      expect(shouldUseProxyFetch('not a url', 1)).toBe(false);
    });

    it('does not use the proxy without a valid viewer fid', () => {
      expect(shouldUseProxyFetch('https://example.com/snap', undefined)).toBe(
        false,
      );
      expect(shouldUseProxyFetch('https://example.com/snap', 0)).toBe(false);
      expect(shouldUseProxyFetch('https://example.com/snap', 1.5)).toBe(false);
    });
  });

  describe('buildSnapCacheKey', () => {
    it('includes proxy mode, fid, and surface when relevant', () => {
      const surface = buildSnapSurface({ hash: '0xabc', authorFid: 123 });

      expect(
        buildSnapCacheKey({
          url: 'https://example.com/snap',
          usesProxy: true,
          fid: 456,
          surface,
        }).split('\n'),
      ).toEqual([
        'https://example.com/snap',
        'proxy',
        '456',
        JSON.stringify(surface),
      ]);
    });

    it('omits fid and surface for direct no-payload fetches', () => {
      expect(
        buildSnapCacheKey({
          url: 'https://example.com/snap',
          usesProxy: false,
          fid: 456,
          surface: buildSnapSurface({ hash: '0xabc', authorFid: 123 }),
        }).split('\n'),
      ).toEqual(['https://example.com/snap', 'direct', '0', 'no-surface']);
    });
  });

  describe('buildSnapGetPayload', () => {
    it('builds a GET payload with viewer fid, audience, and surface', () => {
      const surface = buildSnapSurface({ hash: '0xabc', authorFid: 123 });

      expect(
        buildSnapGetPayload({
          url: 'https://example.com:8443/snap/path?ignored=1',
          fid: 456,
          surface,
        }),
      ).toEqual({
        fid: 456,
        user: { fid: 456 },
        timestamp: 1767225600,
        audience: 'https://example.com:8443',
        surface,
      });
    });

    it('returns null for invalid payload URLs', () => {
      expect(
        buildSnapGetPayload({
          url: 'not a url',
          fid: 123,
          surface: buildSnapSurface(),
        }),
      ).toBeNull();
    });
  });

  describe('proxy/direct/payload branching', () => {
    it('uses proxy with payload for remote snaps', () => {
      const usesProxy = shouldUseProxyFetch('https://example.com/snap', 123);

      expect(usesProxy).toBe(true);
      expect(
        buildSnapGetPayload({
          url: 'https://example.com/snap',
          fid: 123,
          surface: buildSnapSurface(),
        }),
      ).toMatchObject({
        fid: 123,
        audience: 'https://example.com',
        surface: { type: 'standalone' },
      });
    });

    it('uses direct fetch without payload for loopback snaps', () => {
      const usesProxy = shouldUseProxyFetch('https://localhost:8443/snap', 123);

      expect(usesProxy).toBe(false);
    });
  });

  describe('cacheKeyMatchesUrl', () => {
    it('matches exact legacy keys and structured keys for the same URL', () => {
      const cacheKey = buildSnapCacheKey({
        url: 'https://example.com/snap',
        usesProxy: true,
        fid: 123,
        surface: buildSnapSurface(),
      });

      expect(cacheKeyMatchesUrl(cacheKey, 'https://example.com/snap')).toBe(
        true,
      );
      expect(
        cacheKeyMatchesUrl(
          'https://example.com/snap',
          'https://example.com/snap',
        ),
      ).toBe(true);
    });

    it('does not match URLs that only share a string prefix', () => {
      const cacheKey = buildSnapCacheKey({
        url: 'https://example.com/snap-other',
        usesProxy: false,
        fid: undefined,
        surface: buildSnapSurface(),
      });

      expect(cacheKeyMatchesUrl(cacheKey, 'https://example.com/snap')).toBe(
        false,
      );
    });
  });

  describe('buildPendingSnapFetchResult', () => {
    it('keeps the previous snap while the same URL refetches under a new cache key', () => {
      expect(
        buildPendingSnapFetchResult({
          previous: { snap: 'post-action', loading: false },
          previousUrl: 'https://example.com/snap',
          url: 'https://example.com/snap',
        }),
      ).toEqual({ snap: 'post-action', loading: true });
    });

    it('clears the previous snap when a different URL starts loading', () => {
      expect(
        buildPendingSnapFetchResult({
          previous: { snap: 'old-snap', loading: false },
          previousUrl: 'https://example.com/old',
          url: 'https://example.com/new',
        }),
      ).toEqual({ snap: null, loading: true });
    });
  });

  describe('snap fetch cache updates', () => {
    it('updates all entries whose cache keys match the URL', () => {
      const cache = createSnapFetchCache();
      const url = 'https://example.com/snap';
      const directKey = buildSnapCacheKey({
        url,
        usesProxy: false,
        fid: undefined,
        surface: buildSnapSurface(),
      });
      const proxyPayloadKey = buildSnapCacheKey({
        url,
        usesProxy: true,
        fid: 123,
        surface: buildSnapSurface({ hash: '0xabc', authorFid: 456 }),
      });
      const otherKey = buildSnapCacheKey({
        url: 'https://example.com/other',
        usesProxy: false,
        fid: undefined,
        surface: buildSnapSurface(),
      });

      writeSnapFetchCacheEntry(cache, directKey, {
        status: 'resolved',
        snap: 'old-direct',
      });
      writeSnapFetchCacheEntry(cache, proxyPayloadKey, {
        status: 'resolved',
        snap: 'old-proxy',
      });
      writeSnapFetchCacheEntry(cache, otherKey, {
        status: 'resolved',
        snap: 'other',
      });

      updateSnapFetchCacheEntry(cache, url, 'updated');

      expect(readSnapFetchCacheEntry<string>(cache, directKey)).toEqual({
        status: 'resolved',
        snap: 'updated',
      });
      expect(readSnapFetchCacheEntry<string>(cache, proxyPayloadKey)).toEqual({
        status: 'resolved',
        snap: 'updated',
      });
      expect(readSnapFetchCacheEntry<string>(cache, otherKey)).toEqual({
        status: 'resolved',
        snap: 'other',
      });
    });

    it('inserts a direct no-payload cache entry when no existing key matches', () => {
      const cache = createSnapFetchCache();
      const url = 'https://example.com/snap';
      const insertedKey = buildSnapCacheKey({
        url,
        usesProxy: false,
        fid: undefined,
        surface: buildSnapSurface(),
      });

      updateSnapFetchCacheEntry(cache, url, 'inserted');

      expect(readSnapFetchCacheEntry<string>(cache, insertedKey)).toEqual({
        status: 'resolved',
        snap: 'inserted',
      });
    });
  });
});
