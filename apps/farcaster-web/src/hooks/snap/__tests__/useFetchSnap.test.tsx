// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFetchSnap } from '~/hooks/snap/useFetchSnap';

const mocks = vi.hoisted(() => ({
  currentUser: undefined as { fid: number } | undefined,
  fetchSnap: undefined as
    | ((url: string) => Promise<Record<string, unknown> | null>)
    | undefined,
  snapRequest: vi.fn(),
  trackEvent: vi.fn(),
}));

vi.mock('farcaster-client-hooks', () => ({
  buildSnapCacheKey: vi.fn(() => 'snap-cache-key'),
  buildSnapGetPayload: vi.fn(({ url, fid }) => ({
    fid,
    user: { fid },
    timestamp: 1,
    audience: new URL(url).origin,
    surface: { type: 'standalone' },
  })),
  buildSnapSurface: vi.fn(() => ({ type: 'standalone' })),
  invalidateSnapFetchCache: vi.fn(),
  originHostFromUrl: vi.fn((url: string) => new URL(url).hostname),
  shouldUseProxyFetch: vi.fn((url: string, fid: number | undefined) => {
    return (
      typeof fid === 'number' &&
      fid > 0 &&
      new URL(url).protocol === 'https:' &&
      new URL(url).hostname !== 'localhost'
    );
  }),
  snapFetchLatencyMs: vi.fn(() => 1),
  snapFetchTimerNow: vi.fn(() => 1),
  snapUrlForAnalyticsEvent: vi.fn((url: string) => url),
  updateSnapFetchCache: vi.fn(),
  useCachedSnapFetch: vi.fn(
    ({
      fetchSnap,
    }: {
      fetchSnap: (url: string) => Promise<Record<string, unknown> | null>;
    }) => {
      mocks.fetchSnap = fetchSnap;
      return { snap: null, loading: false };
    },
  ),
  useFarcasterApiClient: () => ({
    apiClient: {
      snapRequest: mocks.snapRequest,
    },
  }),
}));

vi.mock('~/contexts/AnalyticsProvider', () => ({
  useAnalytics: () => ({
    trackEvent: mocks.trackEvent,
  }),
}));

vi.mock('~/hooks/data/useCachedCurrentUser', () => ({
  useCachedCurrentUser: () => mocks.currentUser,
}));

vi.mock('~/hooks/data/useCurrentUser', () => ({
  useCurrentUser: () => {
    throw new Error('useCurrentUser should not run in logged-out snap fetches');
  },
}));

vi.mock('~/lib/snap/snapUtils', () => ({
  validateAndParseSnap: (snap: unknown) => snap,
}));

describe('useFetchSnap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser = undefined;
    mocks.fetchSnap = undefined;
  });

  it('fetches directly without requiring a current user when logged out', async () => {
    const snap = { title: 'Logged out snap' };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(snap), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const { result } = renderHook(() =>
      useFetchSnap({ url: 'https://example.com/snap.json' }),
    );

    expect(result.current.loading).toBe(false);
    expect(mocks.fetchSnap).toBeDefined();

    const fetchedSnap = await mocks.fetchSnap?.(
      'https://example.com/snap.json',
    );

    expect(fetchedSnap).toEqual(snap);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/snap.json', {
      headers: {
        Accept: 'application/vnd.farcaster.snap+json,text/html,*/*',
      },
      cache: 'no-store',
    });
    expect(mocks.snapRequest).not.toHaveBeenCalled();
  });
});
