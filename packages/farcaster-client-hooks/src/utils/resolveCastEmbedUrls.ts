import { ApiCast, FarcasterApiClient } from 'farcaster-client-data';

import { isFullCastHash, parseCastUrl, toHashPrefix } from './parseCastUrl';

/** Hard cap on how long a single short-hash resolution may block the composer preview. */
const RESOLUTION_TIMEOUT_MS = 5_000;

/** Successful resolutions live forever in-process; composer previews re-use them. */
const resolvedUrlCache = new Map<string, string>();

/** Deduplicates concurrent in-flight resolutions for the same URL. */
const inFlightResolutions = new Map<string, Promise<string>>();

function findCastMatchingHashPrefix(
  casts: ApiCast[],
  hashPrefix: string,
): ApiCast | undefined {
  const p = hashPrefix.toLowerCase();
  return casts.find((c) => c.hash.toLowerCase().startsWith(p));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`resolveCastEmbedUrl timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function doResolveSingleCastEmbedUrl({
  apiClient,
  url,
}: {
  apiClient: FarcasterApiClient;
  url: string;
}): Promise<string> {
  const parsed = parseCastUrl(url);

  if (parsed.kind === 'not-cast-url') {
    return url;
  }

  const { hashSegment } =
    parsed.kind === 'conversation-hash'
      ? parsed
      : { hashSegment: parsed.hashSegment };

  if (isFullCastHash(hashSegment)) {
    return url;
  }

  try {
    if (parsed.kind === 'username-and-hash') {
      const response = await withTimeout(
        apiClient.getUserCast({
          username: parsed.username,
          hashPrefix: toHashPrefix(parsed.hashSegment),
        }),
        RESOLUTION_TIMEOUT_MS,
      );
      const cast = response.data.result.cast;
      return `https://farcaster.xyz/~/conversations/${cast.hash}`;
    }

    const response = await withTimeout(
      apiClient.getThread({
        castHash: toHashPrefix(hashSegment),
        limit: 15,
      }),
      RESOLUTION_TIMEOUT_MS,
    );
    const casts = response.data.result.casts;
    const cast = findCastMatchingHashPrefix(casts, hashSegment);
    if (typeof cast !== 'undefined') {
      return `https://farcaster.xyz/~/conversations/${cast.hash}`;
    }
  } catch {
    // Fall through to return original URL. A timeout or API error should never
    // block the composer from publishing; the backend will then get the raw URL.
  }

  return url;
}

/**
 * If `url` is a Farcaster cast URL with a short hash, resolves it to the canonical
 * conversation URL with full hash via the API. Otherwise returns `url` unchanged.
 *
 * Results are cached in-process and concurrent callers for the same URL share one
 * API round-trip, so keystroke-level re-invocations from the composer don't fan out.
 */
async function resolveSingleCastEmbedUrl({
  apiClient,
  url,
}: {
  apiClient: FarcasterApiClient;
  url: string;
}): Promise<string> {
  const cached = resolvedUrlCache.get(url);
  if (typeof cached !== 'undefined') {
    return cached;
  }

  const inFlight = inFlightResolutions.get(url);
  if (typeof inFlight !== 'undefined') {
    return inFlight;
  }

  const promise = (async () => {
    try {
      const resolved = await doResolveSingleCastEmbedUrl({ apiClient, url });
      // Only cache when the URL was actually rewritten to a canonical form,
      // so a transient failure doesn't poison the cache with the raw URL.
      if (resolved !== url) {
        resolvedUrlCache.set(url, resolved);
      }
      return resolved;
    } finally {
      inFlightResolutions.delete(url);
    }
  })();

  inFlightResolutions.set(url, promise);
  return promise;
}

/**
 * Resolves any short-hash Farcaster cast URLs in `embeds` to full-hash conversation URLs
 * so `processCastAttachments` and quote-cast flows receive embeds the API accepts.
 */
async function resolveCastEmbedUrls({
  apiClient,
  embeds,
}: {
  apiClient: FarcasterApiClient;
  embeds: string[] | undefined;
}): Promise<string[] | undefined> {
  if (typeof embeds === 'undefined' || embeds.length === 0) {
    return embeds;
  }

  const resolved = await Promise.all(
    embeds.map((e) => resolveSingleCastEmbedUrl({ apiClient, url: e })),
  );

  return resolved;
}

/** Test-only: clear the module-level resolution cache. */
function __resetResolveCastEmbedUrlCacheForTests() {
  resolvedUrlCache.clear();
  inFlightResolutions.clear();
}

export {
  __resetResolveCastEmbedUrlCacheForTests,
  findCastMatchingHashPrefix,
  resolveCastEmbedUrls,
  resolveSingleCastEmbedUrl,
};
