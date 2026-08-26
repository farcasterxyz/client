import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SNAP_INTERACTED_URLS_TTL_MS } from '../interactedSnapUrls/constants';
import {
  buildInteractedSnapUrlsStorageKey,
  hasInteractedSnapUrl,
  markInteractedSnapUrl,
} from '../interactedSnapUrls/interactedSnapUrlsModel';
import { snapInteractionKey } from '../interactedSnapUrls/snapInteractionKey';
import type { InteractedSnapUrlsStore } from '../interactedSnapUrls/types';

function buildMemoryStore(
  initialValues: Record<string, string> = {},
): InteractedSnapUrlsStore & { values: Record<string, string> } {
  const values = { ...initialValues };

  return {
    values,
    getItem: vi.fn(async (key: string) => values[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      values[key] = value;
    }),
  };
}

describe('interactedSnapUrls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('snapInteractionKey', () => {
    it('normalizes to origin and pathname while preserving ports and IPv6 brackets', () => {
      expect(
        snapInteractionKey('https://Example.COM:8443/snap/path/?x=1#section'),
      ).toEqual('https://example.com:8443/snap/path');
      expect(snapInteractionKey('http://[::1]:3000/snap/?x=1')).toEqual(
        'http://[::1]:3000/snap',
      );
      expect(snapInteractionKey('https://example.com/')).toEqual(
        'https://example.com/',
      );
    });

    it('returns null for invalid URLs', () => {
      expect(snapInteractionKey('not a url')).toBeNull();
    });
  });

  describe('interaction model', () => {
    it('marks URLs and detects fresh interactions', async () => {
      const store = buildMemoryStore();
      const scope = { viewerFid: 123 };

      await markInteractedSnapUrl(
        store,
        scope,
        'https://example.com/snap?ignored=1',
      );

      expect(
        await hasInteractedSnapUrl(
          store,
          scope,
          'https://example.com/snap#ignored',
        ),
      ).toBe(true);
    });

    it('prunes expired entries when marking a new interaction', async () => {
      const now = Date.now();
      const scope = { viewerFid: 123 };
      const storageKey = buildInteractedSnapUrlsStorageKey(scope);
      const expiredKey = snapInteractionKey('https://expired.example/snap');
      const freshKey = snapInteractionKey('https://fresh.example/snap');

      const store = buildMemoryStore({
        [storageKey]: JSON.stringify({
          [expiredKey ?? '']: now - SNAP_INTERACTED_URLS_TTL_MS - 1,
        }),
      });

      await markInteractedSnapUrl(store, scope, 'https://fresh.example/snap');

      const saved = JSON.parse(store.values[storageKey] ?? '{}') as Record<
        string,
        number
      >;
      expect(saved).not.toHaveProperty(expiredKey ?? '');
      expect(saved[freshKey ?? '']).toEqual(now);
    });

    it('treats entries older than the TTL as not interacted', async () => {
      const now = Date.now();
      const scope = { viewerFid: 123 };
      const storageKey = buildInteractedSnapUrlsStorageKey(scope);
      const expiredKey = snapInteractionKey('https://expired.example/snap');
      const store = buildMemoryStore({
        [storageKey]: JSON.stringify({
          [expiredKey ?? '']: now - SNAP_INTERACTED_URLS_TTL_MS - 1,
        }),
      });

      expect(
        await hasInteractedSnapUrl(
          store,
          scope,
          'https://expired.example/snap',
        ),
      ).toBe(false);
    });

    it('persists pruned expired entries when checking interactions', async () => {
      const now = Date.now();
      const scope = { viewerFid: 123 };
      const storageKey = buildInteractedSnapUrlsStorageKey(scope);
      const expiredKey = snapInteractionKey('https://expired.example/snap');
      const freshKey = snapInteractionKey('https://fresh.example/snap');
      const store = buildMemoryStore({
        [storageKey]: JSON.stringify({
          [expiredKey ?? '']: now - SNAP_INTERACTED_URLS_TTL_MS - 1,
          [freshKey ?? '']: now,
        }),
      });

      expect(
        await hasInteractedSnapUrl(store, scope, 'https://fresh.example/snap'),
      ).toBe(true);

      const saved = JSON.parse(store.values[storageKey] ?? '{}') as Record<
        string,
        number
      >;
      expect(saved).not.toHaveProperty(expiredKey ?? '');
      expect(saved[freshKey ?? '']).toEqual(now);
    });

    it('ignores unsafe storage keys when pruning persisted interactions', async () => {
      const now = Date.now();
      const scope = { viewerFid: 123 };
      const storageKey = buildInteractedSnapUrlsStorageKey(scope);
      const freshKey = snapInteractionKey('https://fresh.example/snap');
      const store = buildMemoryStore({
        [storageKey]: `{"__proto__":${now},"constructor":${now},"prototype":${now},"${freshKey}":${now}}`,
      });

      expect(
        await hasInteractedSnapUrl(store, scope, 'https://fresh.example/snap'),
      ).toBe(true);

      const saved = JSON.parse(store.values[storageKey] ?? '{}') as Record<
        string,
        number
      >;
      expect(saved).not.toHaveProperty('__proto__');
      expect(saved).not.toHaveProperty('constructor');
      expect(saved).not.toHaveProperty('prototype');
      expect(saved[freshKey ?? '']).toEqual(now);
    });

    it('keeps interactions isolated by viewer fid', async () => {
      const store = buildMemoryStore();
      const firstUser = { viewerFid: 123 };
      const secondUser = { viewerFid: 456 };

      await markInteractedSnapUrl(store, firstUser, 'https://example.com/snap');

      expect(
        await hasInteractedSnapUrl(
          store,
          firstUser,
          'https://example.com/snap',
        ),
      ).toBe(true);
      expect(
        await hasInteractedSnapUrl(
          store,
          secondUser,
          'https://example.com/snap',
        ),
      ).toBe(false);
      expect(
        store.values[buildInteractedSnapUrlsStorageKey(secondUser)],
      ).toBeUndefined();
    });
  });
});
