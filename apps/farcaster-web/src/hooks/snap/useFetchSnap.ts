import type { SnapPage } from '@farcaster/snap/react';
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
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import {
  isDataCloneLikeError,
  logSnapParseError,
  safeStringify,
} from '~/lib/snap/snapDataCloneTrap';
import { SNAP_UPSTREAM_ACCEPT } from '~/lib/snap/snapUpstreamConstants';
import { validateAndParseSnap } from '~/lib/snap/snapUtils';

type TrackEvent = (
  event: AnalyticsEvent,
  data: Record<string, string | boolean | number | undefined>,
) => void;

/**
 * Fetches and validates the full `SnapPage` payload for a URL the server has
 * already identified as a snap (via `openGraph.snap?.url`, see `isSnapEmbed`
 * in `farcaster-client-hooks/EmbedLayoutUtils`).
 *
 * This is NOT a probe — detection happens server-side during OG crawling.
 * The hook only runs once the parent has decided the embed is a snap.
 */

type SnapPageResult = SnapFetchResult<SnapPage>;

async function fetchSnapDirect(
  url: string,
  trackEvent: TrackEvent,
): Promise<SnapPage | null> {
  const originHost = originHostFromUrl(url);
  const snapUrlForEvent = snapUrlForAnalyticsEvent(url);
  let responseBodyText: string | null = null;
  let parsedJson: unknown = undefined;
  // Captured outside the try so the catch can attach it to the
  // `snap_invalid_response` emission — the request already succeeded by
  // the time a parse/validation throw lands here, so the status is known
  // and triage parity with the proxy path's `snap_invalid_response`
  // (which carries `res.data.result.statusCode`) is achievable (Copilot
  // review, PR #10110).
  let responseStatus: number | undefined;
  try {
    const response = await fetch(url, {
      headers: { Accept: SNAP_UPSTREAM_ACCEPT },
      cache: 'no-store',
    });
    responseStatus = response.status;

    if (!response.ok) {
      // Parity with the proxy path's `SnapGetFailure` emission (NEYN-11447).
      // Before this, the three early-bails below returned null silently and
      // the snap renderer surfaced a generic error with no telemetry.
      trackEvent(AnalyticsEvent.SnapGetFailure, {
        originHost,
        payloadIncluded: false,
        failureKind: 'http_status',
        statusCode: response.status,
        snapUrl: snapUrlForEvent,
      });
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('json')) {
      trackEvent(AnalyticsEvent.SnapGetFailure, {
        originHost,
        payloadIncluded: false,
        failureKind: 'non_json_content_type',
        statusCode: response.status,
        snapUrl: snapUrlForEvent,
      });
      return null;
    }

    responseBodyText = await response.text();
    if (!responseBodyText.trim()) {
      trackEvent(AnalyticsEvent.SnapGetFailure, {
        originHost,
        payloadIncluded: false,
        failureKind: 'empty_body',
        statusCode: response.status,
        snapUrl: snapUrlForEvent,
      });
      return null;
    }

    parsedJson = JSON.parse(responseBodyText);
    return validateAndParseSnap(parsedJson);
  } catch (e) {
    // Same gate as `loadSnapFromUrl` in `useSnapActionHandlers`: only emit
    // `snap parse error` if we got past `fetch` (so the failure is parse /
    // validation, not network / HTTP / content-type). Data-clone-like
    // errors are always emitted — that's the specific signal NEYN-10935
    // was added to surface, regardless of where in the flow it lands.
    if (responseBodyText !== null || isDataCloneLikeError(e)) {
      logSnapParseError({
        phase: 'get_direct',
        snapDocumentUrl: url,
        responseBody: { kind: 'raw', text: responseBodyText },
        cloneTarget: parsedJson,
        error: e,
        trackEvent,
      });
    }
    // Parity with the proxy path's outer-catch `SnapGetFailure` emission
    // (NEYN-11447). Discriminate on whether we got past `fetch` — a
    // network/CORS failure (`backend`) looks very different from a
    // post-fetch parse/validation throw (`snap_invalid_response`).
    // `statusCode` rides along only when known: undefined on a `backend`
    // throw (fetch itself failed), set on `snap_invalid_response` (the
    // request succeeded and a downstream parse/validation threw).
    const isPostFetchFailure = responseBodyText !== null;
    trackEvent(AnalyticsEvent.SnapGetFailure, {
      originHost,
      payloadIncluded: false,
      failureKind: isPostFetchFailure ? 'snap_invalid_response' : 'backend',
      statusCode: isPostFetchFailure ? responseStatus : undefined,
      snapUrl: snapUrlForEvent,
    });
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
  const currentUser = useCachedCurrentUser();
  const { trackEvent } = useAnalytics();
  const fid = currentUser?.fid;
  const surface = useMemo(() => buildSnapSurface(castContext), [castContext]);

  const fetchSnapImpl = useCallback(
    async (fetchUrl: string): Promise<SnapPage | null> => {
      if (!shouldUseProxyFetch(fetchUrl, fid)) {
        return fetchSnapDirect(fetchUrl, trackEvent);
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
          const snap = validateAndParseSnap(res.data.result.response);
          trackEvent(AnalyticsEvent.SnapGetViaProxy, {
            originHost,
            payloadIncluded: true,
            latencyMs,
            snapUrl: snapUrlForAnalyticsEvent(fetchUrl),
          });
          return snap;
        } catch (e) {
          logSnapParseError({
            phase: 'get_proxy',
            snapDocumentUrl: fetchUrl,
            responseBody: {
              kind: 'reconstructed',
              text: safeStringify(res.data.result.response),
            },
            cloneTarget: res.data.result.response,
            error: e,
            trackEvent,
          });
          trackEvent(AnalyticsEvent.SnapGetFailure, {
            originHost,
            payloadIncluded: true,
            failureKind: 'snap_invalid_response',
            statusCode: res.data.result.statusCode,
            snapUrl: snapUrlForAnalyticsEvent(fetchUrl),
          });
          return null;
        }
      } catch (e) {
        // Outer catch wraps `apiClient.snapRequest` — these are network /
        // backend errors that already surface as `snap get failure` with
        // failureKind=backend. Don't double-emit a `snap parse error` for
        // those; keep the data-clone gate so an async clone error bubbling
        // through the API client (rare, but the original failure mode this
        // trap was designed for) still gets captured here.
        if (isDataCloneLikeError(e)) {
          logSnapParseError({
            phase: 'get_proxy',
            snapDocumentUrl: fetchUrl,
            responseBody: { kind: 'reconstructed', text: null },
            cloneTarget: undefined,
            error: e,
            trackEvent,
          });
        }
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
export function updateSnapCache(url: string, snap: SnapPage): void {
  updateSnapFetchCache(url, snap);
}

/**
 * Evict a cached entry so the next consumer of `useFetchSnap({ url })` fetches
 * fresh. Used by dev tools that iterate on a snap server and need to see the
 * latest changes, not a cached stale result.
 */
export function invalidateSnapCache(url: string): void {
  invalidateSnapFetchCache(url);
}
