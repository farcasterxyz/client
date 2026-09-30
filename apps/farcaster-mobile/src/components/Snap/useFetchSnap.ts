import { validateSnapResponse } from '@farcaster/snap';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  buildSnapCacheKey,
  buildSnapGetPayload,
  buildSnapSurface,
  invalidateSnapFetchCache,
  originHostFromUrl,
  shouldUseProxyFetch,
  type SnapCastContext,
  snapFetchLatencyMs,
  type SnapFetchResult,
  snapFetchTimerNow,
  snapUrlForAnalyticsEvent,
  updateSnapFetchCache,
  useCachedSnapFetch,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import { useCallback, useMemo } from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import {
  parseSnapPayload,
  SNAP_ACCEPT_HEADER,
  type SnapPageResponse,
} from '~/utils/snapUtils';

/**
 * Fetches and validates the full `SnapPageResponse` for a URL the server has
 * already identified as a snap (via `openGraph.snap?.url`, see `isSnapEmbed`
 * in `farcaster-client-hooks/EmbedLayoutUtils`).
 *
 * This is NOT a probe — detection happens server-side during OG crawling.
 * The hook only runs once the parent has decided the embed is a snap.
 *
 * Mirrors `apps/farcaster-web/src/hooks/snap/useFetchSnap.ts`.
 */

type SnapPageResult = SnapFetchResult<SnapPageResponse>;

async function fetchSnapDirect(url: string): Promise<SnapPageResponse | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: SNAP_ACCEPT_HEADER },
      cache: 'no-store',
    });
    if (!res.ok) {
      return null;
    }
    const text = await res.text();
    if (!text.trim()) {
      return null;
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return null;
    }
    const validation = validateSnapResponse(json);
    if (!validation.valid) {
      return null;
    }
    return parseSnapPayload(json);
  } catch {
    return null;
  }
}

export function useFetchSnap({
  url,
  enabled = true,
  castContext,
}: {
  url: string;
  enabled?: boolean;
  castContext?: SnapCastContext;
}): SnapPageResult {
  const { apiClient } = useFarcasterApiClient();
  const currentUser = useCurrentUser_UNSAFE();
  const { trackEvent } = useAnalytics();
  const fid = currentUser?.fid ?? 0;
  const surface = useMemo(() => buildSnapSurface(castContext), [castContext]);

  const fetchSnapImpl = useCallback(
    async (fetchUrl: string): Promise<SnapPageResponse | null> => {
      if (!shouldUseProxyFetch(fetchUrl, fid)) {
        return fetchSnapDirect(fetchUrl);
      }

      const maybePayload = buildSnapGetPayload({
        url: fetchUrl,
        fid,
        surface,
      });
      if (maybePayload === null) {
        return null;
      }

      const startedAt = snapFetchTimerNow();
      const originHost = originHostFromUrl(fetchUrl);

      try {
        const res = await apiClient.snapRequest({
          targetUrl: fetchUrl,
          method: 'GET',
          payload: maybePayload,
        });

        const latencyMs = snapFetchLatencyMs(startedAt);

        if (!res.data.result.success) {
          trackEvent(AnalyticsEvent.SnapGetFailure, {
            originHost,
            payloadIncluded: true,
            failureKind: 'snap_upstream_error',
            statusCode: res.data.result.statusCode,
            snapUrl: snapUrlForAnalyticsEvent(fetchUrl),
          });
          return null;
        }

        try {
          const json = res.data.result.response;
          const parsed = validateSnapResponse(json);
          if (!parsed.valid) {
            throw new Error('invalid snap');
          }
          const snap = parseSnapPayload(res.data.result.response);
          trackEvent(AnalyticsEvent.SnapGetViaProxy, {
            originHost,
            payloadIncluded: true,
            latencyMs,
            snapUrl: snapUrlForAnalyticsEvent(fetchUrl),
          });
          return snap;
        } catch {
          trackEvent(AnalyticsEvent.SnapGetFailure, {
            originHost,
            payloadIncluded: true,
            failureKind: 'snap_invalid_response',
            statusCode: res.data.result.statusCode,
            snapUrl: snapUrlForAnalyticsEvent(fetchUrl),
          });
          return null;
        }
      } catch {
        const latencyMs = snapFetchLatencyMs(startedAt);
        trackEvent(AnalyticsEvent.SnapGetFailure, {
          originHost,
          payloadIncluded: true,
          failureKind: 'backend',
          snapUrl: snapUrlForAnalyticsEvent(fetchUrl),
          latencyMs,
        });
        return null;
      }
    },
    [apiClient, fid, surface, trackEvent],
  );

  const usesProxy = shouldUseProxyFetch(url, fid);
  const cacheKey = buildSnapCacheKey({
    url,
    usesProxy,
    fid,
    surface,
  });

  return useCachedSnapFetch({
    url,
    cacheKey,
    enabled,
    fetchSnap: fetchSnapImpl,
  });
}

/** Update a snap in the cache (e.g., after a submit action returns a new snap). */
export function updateSnapCache(url: string, snap: SnapPageResponse): void {
  updateSnapFetchCache(url, snap);
}

/**
 * Evict a cached entry so the next consumer of `useFetchSnap({ url })` fetches
 * fresh. Used by the dev emulator's Reset flow where devs iterate on a snap
 * server and need to see their latest changes, not a cached stale result.
 */
export function invalidateSnapCache(url: string): void {
  invalidateSnapFetchCache(url);
}
