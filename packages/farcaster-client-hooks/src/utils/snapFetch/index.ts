import { useEffect, useRef, useState } from 'react';

type SnapCastContext = {
  hash: string;
  authorFid: number;
};

type SnapSurface =
  | {
      type: 'cast';
      cast: {
        hash: string;
        author: { fid: number };
      };
    }
  | { type: 'standalone' };

type SnapGetPayload = {
  fid: number;
  user: { fid: number };
  timestamp: number;
  audience: string;
  surface: SnapSurface;
};

type SnapFetchResult<TSnap> = {
  snap: TSnap | null;
  loading: boolean;
};

type SnapFetchCacheEntry<TSnap> =
  | { status: 'pending'; promise: Promise<TSnap | null> }
  | { status: 'resolved'; snap: TSnap | null };

type UseCachedSnapFetchArgs<TSnap> = {
  url: string;
  cacheKey: string;
  enabled: boolean;
  fetchSnap: (url: string) => Promise<TSnap | null>;
};

type SnapFetchCache = Map<string, SnapFetchCacheEntry<unknown>>;

function createSnapFetchCache(): SnapFetchCache {
  return new Map<string, SnapFetchCacheEntry<unknown>>();
}

const snapFetchCache = createSnapFetchCache();

function isLocalhostUrl(href: string): boolean {
  try {
    const u = new URL(href);
    const h = u.hostname.toLowerCase();
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '::1' ||
      h === '[::1]' ||
      // Android emulator's host loopback. Treat it the same as localhost for
      // the dev-mode bypass paths.
      h === '10.0.2.2'
    );
  } catch {
    return false;
  }
}

function originHostFromUrl(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function hasValidViewerFid(fid: number | undefined): fid is number {
  return (
    typeof fid === 'number' &&
    Number.isFinite(fid) &&
    Number.isInteger(fid) &&
    fid > 0
  );
}

function shouldUseProxyFetch(
  url: string,
  fid: number | undefined,
): fid is number {
  try {
    const parsedUrl = new URL(url);
    return (
      hasValidViewerFid(fid) &&
      parsedUrl.protocol === 'https:' &&
      !isLocalhostUrl(url)
    );
  } catch {
    return false;
  }
}

function buildSnapSurface(castContext?: SnapCastContext): SnapSurface {
  return castContext
    ? {
        type: 'cast',
        cast: {
          hash: castContext.hash,
          author: { fid: castContext.authorFid },
        },
      }
    : { type: 'standalone' };
}

function buildSnapCacheKey({
  url,
  usesProxy,
  fid,
  surface,
}: {
  url: string;
  usesProxy: boolean;
  fid: number | undefined;
  surface: SnapSurface;
}): string {
  return [
    url,
    usesProxy ? 'proxy' : 'direct',
    usesProxy ? (fid ?? 0) : 0,
    usesProxy ? JSON.stringify(surface) : 'no-surface',
  ].join('\n');
}

function buildSnapGetPayload({
  url,
  fid,
  surface,
}: {
  url: string;
  fid: number;
  surface: SnapSurface;
}): SnapGetPayload | null {
  try {
    return {
      fid,
      user: { fid },
      timestamp: Math.floor(Date.now() / 1000),
      audience: new URL(url).origin,
      surface,
    };
  } catch {
    return null;
  }
}

function snapFetchTimerNow(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function snapFetchLatencyMs(startedAt: number): number {
  return Math.round(snapFetchTimerNow() - startedAt);
}

function buildPendingSnapFetchResult<TSnap>({
  previous,
  previousUrl,
  url,
}: {
  previous: SnapFetchResult<TSnap>;
  previousUrl: string | null;
  url: string;
}): SnapFetchResult<TSnap> {
  if (previous.snap !== null && previousUrl === url) {
    return { snap: previous.snap, loading: true };
  }
  return { snap: null, loading: true };
}

function cacheKeyMatchesUrl(cacheKey: string, url: string): boolean {
  return cacheKey === url || cacheKey.startsWith(`${url}\n`);
}

function readSnapFetchCacheEntry<TSnap>(
  cache: SnapFetchCache,
  cacheKey: string,
): SnapFetchCacheEntry<TSnap> | undefined {
  return cache.get(cacheKey) as SnapFetchCacheEntry<TSnap> | undefined;
}

function writeSnapFetchCacheEntry<TSnap>(
  cache: SnapFetchCache,
  cacheKey: string,
  entry: SnapFetchCacheEntry<TSnap>,
): void {
  cache.set(cacheKey, entry as SnapFetchCacheEntry<unknown>);
}

function updateSnapFetchCacheEntry<TSnap>(
  cache: SnapFetchCache,
  url: string,
  snap: TSnap,
): void {
  let updated = false;
  for (const cacheKey of cache.keys()) {
    if (cacheKeyMatchesUrl(cacheKey, url)) {
      writeSnapFetchCacheEntry(cache, cacheKey, { status: 'resolved', snap });
      updated = true;
    }
  }
  if (!updated) {
    writeSnapFetchCacheEntry(
      cache,
      buildSnapCacheKey({
        url,
        usesProxy: false,
        fid: undefined,
        surface: { type: 'standalone' },
      }),
      { status: 'resolved', snap },
    );
  }
}

function invalidateSnapFetchCacheEntry(
  cache: SnapFetchCache,
  url: string,
): void {
  for (const cacheKey of cache.keys()) {
    if (cacheKeyMatchesUrl(cacheKey, url)) {
      cache.delete(cacheKey);
    }
  }
}

function updateSnapFetchCache<TSnap>(url: string, snap: TSnap): void {
  updateSnapFetchCacheEntry(snapFetchCache, url, snap);
}

function invalidateSnapFetchCache(url: string): void {
  invalidateSnapFetchCacheEntry(snapFetchCache, url);
}

function useCachedSnapFetch<TSnap>({
  url,
  cacheKey,
  enabled,
  fetchSnap,
}: UseCachedSnapFetchArgs<TSnap>): SnapFetchResult<TSnap> {
  const resultUrlRef = useRef<string | null>(null);
  const [result, setResult] = useState<SnapFetchResult<TSnap>>(() => {
    if (!enabled) {
      return { snap: null, loading: false };
    }
    const cached = readSnapFetchCacheEntry<TSnap>(snapFetchCache, cacheKey);
    if (cached?.status === 'resolved') {
      resultUrlRef.current = url;
      return { snap: cached.snap, loading: false };
    }
    return { snap: null, loading: true };
  });

  const urlRef = useRef(url);
  urlRef.current = url;

  const fetchRef = useRef(fetchSnap);
  fetchRef.current = fetchSnap;

  useEffect(() => {
    if (!enabled) {
      resultUrlRef.current = null;
      setResult({ snap: null, loading: false });
      return;
    }

    const cached = readSnapFetchCacheEntry<TSnap>(snapFetchCache, cacheKey);
    if (cached?.status === 'resolved') {
      resultUrlRef.current = url;
      setResult({ snap: cached.snap, loading: false });
      return;
    }

    let cancelled = false;

    let promise: Promise<TSnap | null>;
    if (cached?.status === 'pending') {
      promise = cached.promise;
    } else {
      promise = fetchRef.current(url);
      writeSnapFetchCacheEntry(snapFetchCache, cacheKey, {
        status: 'pending',
        promise,
      });
    }

    setResult((previous) => {
      const pending = buildPendingSnapFetchResult({
        previous,
        previousUrl: resultUrlRef.current,
        url,
      });
      return pending;
    });

    promise
      .then((snap) => {
        const currentEntry = readSnapFetchCacheEntry<TSnap>(
          snapFetchCache,
          cacheKey,
        );
        if (
          currentEntry?.status === 'pending' &&
          currentEntry.promise === promise
        ) {
          writeSnapFetchCacheEntry(snapFetchCache, cacheKey, {
            status: 'resolved',
            snap,
          });
        }
        if (!cancelled && urlRef.current === url) {
          resultUrlRef.current = url;
          setResult({ snap, loading: false });
        }
      })
      .catch(() => {
        const currentEntry = readSnapFetchCacheEntry<TSnap>(
          snapFetchCache,
          cacheKey,
        );
        if (
          currentEntry?.status === 'pending' &&
          currentEntry.promise === promise
        ) {
          writeSnapFetchCacheEntry(snapFetchCache, cacheKey, {
            status: 'resolved',
            snap: null,
          });
        }
        if (!cancelled && urlRef.current === url) {
          resultUrlRef.current = url;
          setResult({ snap: null, loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, cacheKey, enabled, fetchSnap]);

  return result;
}

export {
  buildPendingSnapFetchResult,
  buildSnapCacheKey,
  buildSnapGetPayload,
  buildSnapSurface,
  cacheKeyMatchesUrl,
  createSnapFetchCache,
  hasValidViewerFid,
  invalidateSnapFetchCache,
  invalidateSnapFetchCacheEntry,
  isLocalhostUrl,
  originHostFromUrl,
  readSnapFetchCacheEntry,
  shouldUseProxyFetch,
  snapFetchLatencyMs,
  snapFetchTimerNow,
  updateSnapFetchCache,
  updateSnapFetchCacheEntry,
  useCachedSnapFetch,
  writeSnapFetchCacheEntry,
};
export type {
  SnapCastContext,
  SnapFetchCache,
  SnapFetchCacheEntry,
  SnapFetchResult,
  SnapGetPayload,
  SnapSurface,
};
