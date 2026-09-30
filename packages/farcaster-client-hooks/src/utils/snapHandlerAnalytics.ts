/**
 * {@link AnalyticsEvent.SnapHandler} payload: which snap UI action fired.
 */
import type { CastViewTrackingData } from '../providers/InternalEventingProvider';

type SnapHandlerKind =
  | 'submit'
  | 'paginator_next'
  | 'paginator_prev'
  | 'paginator_go_to'
  | 'open_url'
  | 'open_mini_app'
  | 'open_snap'
  | 'view_cast'
  | 'view_profile'
  | 'view_channel'
  | 'compose_cast'
  | 'view_token'
  | 'send_token'
  | 'swap_token'
  | 'send_transaction';

/**
 * Where the snap ran: web/mobile cast embed or the web developers emulator.
 */
type SnapHandlerSurface =
  | 'cast_embed_web'
  | 'cast_embed_mobile'
  | 'snaps_emulator';

type SnapSourceBucket = 'generated' | 'host_neynar' | 'self_hosted' | 'unknown';

type SnapRenderStateLike = Record<string, unknown> | null | undefined;

type SnapPaginatorChangeAnalytics = {
  handler: Extract<
    SnapHandlerKind,
    'paginator_next' | 'paginator_prev' | 'paginator_go_to'
  >;
  previousPage: number;
  page: number;
  pageCount?: number;
};

type SnapActivationTrigger = SnapHandlerKind | 'lift';

type SnapActivationAnalyticsInput = {
  snapUrl: string | null | undefined;
  surface: SnapHandlerSurface;
  activationTrigger: SnapActivationTrigger;
  castHash?: string;
  castAuthorFid?: number;
};

export type {
  SnapActivationAnalyticsInput,
  SnapActivationTrigger,
  SnapHandlerKind,
  SnapHandlerSurface,
  SnapPaginatorChangeAnalytics,
  SnapRenderStateLike,
};

/**
 * Normalizes a snap document URL for {@link AnalyticsEvent.SnapHandler} —
 * strips `?query` (hash is preserved). Invalid URLs are returned unchanged.
 */
export function snapUrlForAnalyticsEvent(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    return u.href;
  } catch {
    return url;
  }
}

function getSnapDomain(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function getSnapSourceBucket(url: string | null | undefined): SnapSourceBucket {
  const domain = getSnapDomain(url);

  if (!domain) {
    return 'unknown';
  }

  if (
    domain.endsWith('.neynar.app') ||
    domain === 'snap-builder-api.REPLACE_ME.workers.dev'
  ) {
    return 'generated';
  }

  if (domain === 'host.neynar.com') {
    return 'host_neynar';
  }

  return 'self_hosted';
}

function buildSnapHandlerAnalyticsProps(url: string | null | undefined) {
  const snapDomain = getSnapDomain(url);

  return {
    snapSourceBucket: getSnapSourceBucket(url),
    ...(snapDomain ? { snapDomain } : {}),
    ...(url ? { snapUrl: snapUrlForAnalyticsEvent(url) } : {}),
  };
}

function buildSnapActivationAnalyticsProps(
  data: SnapActivationAnalyticsInput,
  defaultCastViewProps: Partial<CastViewTrackingData> = {},
) {
  const includeReason = defaultCastViewProps.includeReason;
  const position = defaultCastViewProps.index;
  const homeFeedSnapBoostVariant =
    defaultCastViewProps.homeFeedSnapBoostVariant;

  return {
    activationTrigger: data.activationTrigger,
    surface: data.surface,
    ...((data.castHash ?? defaultCastViewProps.castHash)
      ? { castHash: data.castHash ?? defaultCastViewProps.castHash }
      : {}),
    ...((data.castAuthorFid ?? defaultCastViewProps.castAuthorFid)
      ? {
          castAuthorFid:
            data.castAuthorFid ?? defaultCastViewProps.castAuthorFid,
        }
      : {}),
    ...(defaultCastViewProps.feed ? { feed: defaultCastViewProps.feed } : {}),
    ...(includeReason ? { reason: includeReason, includeReason } : {}),
    ...(position !== undefined ? { position, index: position } : {}),
    ...(homeFeedSnapBoostVariant
      ? {
          homeFeedSnapBoostVariant,
          home_feed_snap_boost_variant: homeFeedSnapBoostVariant,
        }
      : {}),
    ...buildSnapHandlerAnalyticsProps(data.snapUrl),
  };
}

function getStatePathNumber(
  state: SnapRenderStateLike,
  path: string[],
): number | undefined {
  let current: unknown = state;
  for (const key of path) {
    if (
      !current ||
      typeof current !== 'object' ||
      Array.isArray(current) ||
      !(key in current)
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'number' && Number.isInteger(current)
    ? current
    : undefined;
}

function getSnapPaginatorChangeAnalytics({
  previousState,
  nextState,
}: {
  previousState: SnapRenderStateLike;
  nextState: SnapRenderStateLike;
}): SnapPaginatorChangeAnalytics | null {
  const previousPage =
    getStatePathNumber(previousState, ['ui', 'paginator', 'page']) ?? 0;
  const page = getStatePathNumber(nextState, ['ui', 'paginator', 'page']);

  if (page === undefined || page === previousPage) {
    return null;
  }

  const pageCount = getStatePathNumber(nextState, [
    'ui',
    'paginator',
    'pageCount',
  ]);
  const handler =
    page === previousPage + 1
      ? 'paginator_next'
      : page === previousPage - 1
        ? 'paginator_prev'
        : 'paginator_go_to';

  return {
    handler,
    previousPage,
    page,
    ...(pageCount !== undefined ? { pageCount } : {}),
  };
}

export {
  buildSnapActivationAnalyticsProps,
  buildSnapHandlerAnalyticsProps,
  getSnapDomain,
  getSnapPaginatorChangeAnalytics,
  getSnapSourceBucket,
};
