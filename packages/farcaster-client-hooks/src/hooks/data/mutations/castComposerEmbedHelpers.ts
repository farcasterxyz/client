import type {
  ApiCastEmbeds,
  ApiCastImageEmbed,
  ApiCastUrlEmbed,
  ApiCastVideoEmbed,
} from 'farcaster-client-data';

import {
  buildQuoteCastUrlSet,
  isQuoteCastUrl,
  stripQuoteCastUrlEmbeds,
} from '../../../utils/quoteCastUrls';

/**
 * The source of a URL or snap embed – distinguishes how it arrived so that
 * source-scoped sync can replace only the right entries.
 */
export type CastComposerUrlEmbedSource = 'text' | 'other';

/**
 * Canonical, ordered embed entry. Every entry carries a stable `id` so async
 * operations (metadata resolution, upload completion) can safely write back
 * without mutating the wrong entry after replacement or removal.
 */
export type CastComposerEmbed =
  | {
      id: string;
      kind: 'image';
      url?: string;
      localUriRef?: string;
      previewUrl?: string;
      uploadPromise?: Promise<Response>;
      uploadStatus?: 'idle' | 'uploading' | 'uploaded' | 'failed';
      uploadError?: string;
      imageDeleteHash?: string;
      aspectRatio?: number;
      width?: number;
      height?: number;
      /** API-shaped embed stored after upload, used by apiEmbedsForCast. */
      apiImageEmbed?: ApiCastImageEmbed;
    }
  | {
      id: string;
      kind: 'video';
      url?: string;
      localUriRef: string;
      videoId?: string;
      uploadPromise?: Promise<unknown>;
      uploadStatus?: 'idle' | 'uploading' | 'uploaded' | 'failed';
      uploadError?: string;
      width: number;
      height: number;
      thumbnailUrl?: string;
      /** API-shaped embed stored once the video is ready. */
      apiVideoEmbed?: ApiCastVideoEmbed;
    }
  | {
      id: string;
      kind: 'url';
      url: string;
      source: CastComposerUrlEmbedSource;
      metadata?: ApiCastUrlEmbed;
      metadataStatus?: 'idle' | 'loading' | 'loaded' | 'failed';
    }
  | {
      id: string;
      kind: 'snap';
      url: string;
      source: CastComposerUrlEmbedSource;
      metadata?: ApiCastUrlEmbed;
      metadataStatus?: 'idle' | 'loading' | 'loaded' | 'failed';
    }
  | {
      id: string;
      kind: 'cast';
      hash: string;
      url?: string;
    };

export type CastComposerEmbedsMap = {
  [castLocalKey: number]: CastComposerEmbed[];
};

// ---------------------------------------------------------------------------
// Pure array helpers – all functions are side-effect free and unit-testable
// without rendering the hook.
// ---------------------------------------------------------------------------

/**
 * Canonicalize a URL string for use as an equality key in dedupe / dismiss /
 * ignore sets. Treats the following as equivalent:
 *   - extra surrounding whitespace
 *   - host-only `https://grin.io` vs `https://grin.io/`
 *   - non-root trailing slash `https://grin.io/chat` vs `https://grin.io/chat/`
 *
 * The result is intended for comparison only – never display – because the
 * trailing-slash strip would surprise URL bars and OG previews. Keep raw
 * URLs in canonical embed state and only call this when bucketing into a
 * Map / Set or comparing two URLs for "same link".
 */
export function normalizeComposerEmbedUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    if (u.pathname.endsWith('/') && u.pathname.length > 1) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.href;
  } catch {
    return trimmed;
  }
}

export function getUrlSnapEmbedNormalizedUrls(
  embed: Extract<CastComposerEmbed, { kind: 'url' | 'snap' }>,
): Set<string> {
  const urls = [embed.url];
  const openGraph = embed.metadata?.openGraph;
  if (openGraph?.url) {
    urls.push(openGraph.url);
  }
  if (openGraph?.sourceUrl) {
    urls.push(openGraph.sourceUrl);
  }

  return new Set(urls.map(normalizeComposerEmbedUrl));
}

export function urlSnapEmbedMatchesUrl({
  embed,
  url,
}: {
  embed: Extract<CastComposerEmbed, { kind: 'url' | 'snap' }>;
  url: string;
}): boolean {
  return getUrlSnapEmbedNormalizedUrls(embed).has(
    normalizeComposerEmbedUrl(url),
  );
}

export function urlSnapEmbedMatchesAnyUrl({
  embed,
  urls,
}: {
  embed: Extract<CastComposerEmbed, { kind: 'url' | 'snap' }>;
  urls: Iterable<string>;
}): boolean {
  for (const url of urls) {
    if (urlSnapEmbedMatchesUrl({ embed, url })) {
      return true;
    }
  }
  return false;
}

export function buildUrlSnapEmbedIgnoreSet({
  embeds,
  url,
  existingUrlsToIgnore = new Set(),
}: {
  embeds: CastComposerEmbed[];
  url: string;
  existingUrlsToIgnore?: ReadonlySet<string>;
}): Set<string> {
  const urlsToIgnore = new Set(existingUrlsToIgnore);
  urlsToIgnore.add(normalizeComposerEmbedUrl(url));

  for (const embed of embeds) {
    if (embed.kind !== 'url' && embed.kind !== 'snap') {
      continue;
    }
    if (!urlSnapEmbedMatchesUrl({ embed, url })) {
      continue;
    }
    for (const normalizedUrl of getUrlSnapEmbedNormalizedUrls(embed)) {
      urlsToIgnore.add(normalizedUrl);
    }
  }

  return urlsToIgnore;
}

/** True if this resolved URL embed corresponds to the user-typed / requested URL. */
export function requestedUrlMatchesUrlEmbed(
  requestedUrl: string,
  embed: ApiCastUrlEmbed,
): boolean {
  const norm = normalizeComposerEmbedUrl(requestedUrl);
  const og = embed.openGraph;
  if (normalizeComposerEmbedUrl(og.url) === norm) {
    return true;
  }
  if (typeof og.sourceUrl === 'string' && og.sourceUrl.length > 0) {
    return normalizeComposerEmbedUrl(og.sourceUrl) === norm;
  }
  return false;
}

/**
 * Project a crawl response down to one preview per requested URL.
 *
 * The composer asks the API for N URLs and expects at most N preview cards
 * back. The crawl can return more than one entry for a single requested URL
 * (e.g. a trailing-slash variant or a redirect target whose `openGraph.url`
 * differs from what we asked for) – those would otherwise survive the
 * `openGraph.url`-keyed dedupe and render as duplicate cards that all share
 * the same dismiss action. Order matches `requestedUrls`. Response embeds
 * that don't match any requested URL are dropped (the crawl never invents
 * URLs the user didn't reference).
 */
export function pickOneEmbedPerRequestedUrl(
  requestedUrls: string[],
  urlEmbeds: ApiCastUrlEmbed[],
): ApiCastUrlEmbed[] {
  const out: ApiCastUrlEmbed[] = [];
  const seenRequested = new Set<string>();
  for (const requestedUrl of requestedUrls) {
    const key = normalizeComposerEmbedUrl(requestedUrl);
    if (seenRequested.has(key)) {
      continue;
    }
    seenRequested.add(key);
    const match = urlEmbeds.find((embed) =>
      requestedUrlMatchesUrlEmbed(requestedUrl, embed),
    );
    if (match) {
      out.push(match);
    }
  }
  return out;
}

/**
 * Merge several URL-string sources (typically intent embeds, linkify matches,
 * manual adds) into a single ordered candidate list. Empty strings and any
 * URL whose normalized form is in `dismissed` are filtered out, and the first
 * occurrence wins for any pair of URLs that normalize to the same value. The
 * returned value is the normalized form used for embed fetching/submission;
 * composer text rendering still uses the editor text itself.
 *
 * `dismissed` is matched against the **normalized** form of each candidate so
 * a dismiss entered as `https://grin.io/chat` also blocks `https://grin.io/chat/`
 * and vice versa – both QueuedCast composers used to do this dedupe inline
 * with raw-string `Set.has`, which leaked across trailing-slash variants.
 */
export function mergeCandidateUrls(
  sources: ReadonlyArray<readonly string[]>,
  dismissed: ReadonlySet<string>,
): string[] {
  const dismissedNormalized = new Set<string>();
  for (const url of dismissed) {
    dismissedNormalized.add(normalizeComposerEmbedUrl(url));
  }
  const byNormalizedUrl = new Map<string, string>();
  for (const source of sources) {
    for (const url of source) {
      if (!url) {
        continue;
      }
      const key = normalizeComposerEmbedUrl(url);
      if (dismissedNormalized.has(key)) {
        continue;
      }
      if (!byNormalizedUrl.has(key)) {
        byNormalizedUrl.set(key, key);
      }
    }
  }
  return Array.from(byNormalizedUrl.values());
}

/**
 * Later `url` / `snap` entries that share the same normalized URL as an
 * earlier entry are dropped. Other embed kinds are unchanged and stay in order.
 */
export function dedupeUrlSnapEmbedsPreserveOrder(
  embeds: CastComposerEmbed[],
): CastComposerEmbed[] {
  const seen = new Set<string>();
  const out: CastComposerEmbed[] = [];
  for (const e of embeds) {
    if (e.kind !== 'url' && e.kind !== 'snap') {
      out.push(e);
      continue;
    }
    const keys = getUrlSnapEmbedNormalizedUrls(e);
    if ([...keys].some((key) => seen.has(key))) {
      continue;
    }
    for (const key of keys) {
      seen.add(key);
    }
    out.push(e);
  }
  return out;
}

/**
 * Append an embed if there is still a free slot. Returns the array unchanged
 * when the limit has been reached.
 */
export function addEmbedToCast(
  embeds: CastComposerEmbed[],
  embed: CastComposerEmbed,
  maxEmbedsLength: number,
): CastComposerEmbed[] {
  if (embeds.length >= maxEmbedsLength) {
    return embeds;
  }
  return [...embeds, embed];
}

/**
 * Remove all entries matching the predicate. Entries that do not match are
 * kept in their original order.
 */
export function removeEmbedsFromCast(
  embeds: CastComposerEmbed[],
  predicate: (embed: CastComposerEmbed) => boolean,
): CastComposerEmbed[] {
  return embeds.filter((e) => !predicate(e));
}

/**
 * Replace only entries that carry `source === source` with the supplied
 * candidates. Entries from every other source are preserved in their original
 * positions (at the front of the array). Candidate entries that would exceed
 * the slot limit are silently dropped.
 *
 * This is the low-level primitive that replaces updateURLEmbeds for text URL
 * synchronization.
 */
export function syncEmbedsBySourceForCast(
  embeds: CastComposerEmbed[],
  source: string,
  candidates: CastComposerEmbed[],
  maxEmbedsLength: number,
): CastComposerEmbed[] {
  const kept = embeds.filter((e) => !('source' in e && e.source === source));
  return dedupeUrlSnapEmbedsPreserveOrder([...kept, ...candidates]).slice(
    0,
    maxEmbedsLength,
  );
}

/**
 * Merge draft/intent hydration results with current user-added embeds.
 *
 * Intent embeds are resolved asynchronously. If a user types a URL while a
 * quote-cast hydrate is still in flight, replacing the whole cast bucket drops
 * the text URL that `syncEmbedsBySource` already added. Keep only user-added
 * entries from the previous bucket; draft/intent entries remain authoritative
 * for persisted media, quote casts, and non-text URL embeds.
 */
export function mergeHydratedEmbedsPreservingTextSource(
  existingEmbeds: CastComposerEmbed[],
  hydratedEmbeds: CastComposerEmbed[],
  maxEmbedsLength: number,
): CastComposerEmbed[] {
  const existingUserAddedEmbeds = existingEmbeds.filter(
    (e) => (e.kind === 'url' || e.kind === 'snap') && e.source === 'text',
  );

  return dedupeUrlSnapEmbedsPreserveOrder([
    ...hydratedEmbeds,
    ...existingUserAddedEmbeds,
  ]).slice(0, maxEmbedsLength);
}

function dedupeApiUrlEmbedsPreserveOrder(
  urlEmbeds: ApiCastUrlEmbed[],
): ApiCastUrlEmbed[] {
  const seen = new Set<string>();
  const result: ApiCastUrlEmbed[] = [];

  for (const embed of urlEmbeds) {
    const keys = [embed.openGraph.url, embed.openGraph.sourceUrl]
      .filter((url): url is string => Boolean(url))
      .map(normalizeComposerEmbedUrl);

    if (keys.some((key) => seen.has(key))) {
      continue;
    }

    keys.forEach((key) => seen.add(key));
    result.push(embed);
  }

  return result;
}

export function mergeHydratedProcessedEmbedsPreservingTextUrls({
  existingProcessedEmbeds,
  hydratedProcessedEmbeds,
  currentCanonicalEmbeds,
}: {
  existingProcessedEmbeds: ApiCastEmbeds | undefined;
  hydratedProcessedEmbeds: ApiCastEmbeds;
  currentCanonicalEmbeds: CastComposerEmbed[];
}): ApiCastEmbeds {
  const textUrlEmbeds = currentCanonicalEmbeds.filter(
    (embed): embed is Extract<CastComposerEmbed, { kind: 'url' | 'snap' }> =>
      (embed.kind === 'url' || embed.kind === 'snap') &&
      embed.source === 'text',
  );

  const quoteCastUrls =
    (hydratedProcessedEmbeds.casts?.length ?? 0) > 0
      ? buildQuoteCastUrlSet({ quotes: hydratedProcessedEmbeds.casts ?? [] })
      : undefined;

  const existingTextUrls =
    existingProcessedEmbeds?.urls.filter((urlEmbed) => {
      if (
        quoteCastUrls &&
        isQuoteCastUrl({
          url: urlEmbed.openGraph.url,
          sourceUrl: urlEmbed.openGraph.sourceUrl,
          quoteCastUrls,
        })
      ) {
        return false;
      }
      return textUrlEmbeds.some((textEmbed) =>
        requestedUrlMatchesUrlEmbed(textEmbed.url, urlEmbed),
      );
    }) ?? [];

  return stripQuoteCastUrlEmbeds({
    ...hydratedProcessedEmbeds,
    urls: dedupeApiUrlEmbedsPreserveOrder([
      ...(hydratedProcessedEmbeds.urls ?? []),
      ...existingTextUrls,
    ]),
  });
}

export function pruneProcessedUrlEmbedsByUrls({
  processedEmbeds,
  urls,
}: {
  processedEmbeds: ApiCastEmbeds;
  urls: Iterable<string>;
}): ApiCastEmbeds {
  const urlsToPrune = Array.from(urls);
  if (urlsToPrune.length === 0) {
    return processedEmbeds;
  }

  return {
    ...processedEmbeds,
    urls: processedEmbeds.urls.filter(
      (urlEmbed) =>
        !urlsToPrune.some((url) => requestedUrlMatchesUrlEmbed(url, urlEmbed)),
    ),
  };
}

export function pruneProcessedUrlEmbedsToCanonicalUrls({
  processedEmbeds,
  canonicalEmbeds,
}: {
  processedEmbeds: ApiCastEmbeds;
  canonicalEmbeds: CastComposerEmbed[];
}): ApiCastEmbeds {
  const canonicalUrlEmbeds = canonicalEmbeds.filter(
    (embed): embed is Extract<CastComposerEmbed, { kind: 'url' | 'snap' }> =>
      embed.kind === 'url' || embed.kind === 'snap',
  );

  return {
    ...processedEmbeds,
    urls: processedEmbeds.urls.filter((urlEmbed) =>
      canonicalUrlEmbeds.some((canonicalEmbed) =>
        requestedUrlMatchesUrlEmbed(canonicalEmbed.url, urlEmbed),
      ),
    ),
  };
}

/**
 * Return the ordered list of URL strings / cast hashes represented by the
 * canonical embed array. Quote-cast entries contribute their `hash` so
 * round-trips through draft save/restore do not lose them.
 *
 * In-flight and failed media entries are skipped. Callers that need to await
 * uploads before publishing should use `getEmbedsToSubmit` instead.
 */
export function embedUrlsForCast(
  embeds: CastComposerEmbed[],
  { includeTextEmbeds = true }: { includeTextEmbeds?: boolean } = {},
): string[] {
  const urls: string[] = [];
  for (const embed of embeds) {
    if (embed.kind === 'cast') {
      urls.push(embed.hash);
    } else if (
      !includeTextEmbeds &&
      (embed.kind === 'url' || embed.kind === 'snap') &&
      embed.source === 'text'
    ) {
      continue;
    } else if (
      (embed.kind === 'image' || embed.kind === 'video') &&
      (embed.uploadStatus === 'uploading' || embed.uploadStatus === 'failed')
    ) {
      continue;
    } else if ('url' in embed && embed.url) {
      urls.push(embed.url);
    }
  }
  return urls;
}

/**
 * Derive API-shaped embed buckets (the shape expected by preview renderers)
 * from the canonical ordered array. Only entries that already have their
 * resolved API embed stored (apiImageEmbed / apiVideoEmbed / metadata) are
 * included; in-flight or failed entries without final data are omitted.
 *
 * Call site note: the hook should call this whenever canonical state changes
 * and store the result as `processedEmbeds` for backward-compat consumers.
 */
export function apiEmbedsForCast(embeds: CastComposerEmbed[]): ApiCastEmbeds {
  const images: ApiCastImageEmbed[] = [];
  const videos: ApiCastVideoEmbed[] = [];
  const urls: ApiCastUrlEmbed[] = [];

  for (const embed of embeds) {
    switch (embed.kind) {
      case 'image': {
        if (embed.apiImageEmbed) {
          images.push(embed.apiImageEmbed);
        } else if (embed.url) {
          // Synthesize a minimal API image embed from available fields.
          images.push({
            type: 'image',
            alt: 'Image',
            sourceUrl: embed.url,
            url: embed.url,
            ...(embed.width &&
              embed.height && {
                media: {
                  height: embed.height,
                  width: embed.width,
                  version: '2' as const,
                  staticRaster: embed.url,
                },
              }),
          });
        }
        break;
      }
      case 'video': {
        if (embed.apiVideoEmbed) {
          videos.push(embed.apiVideoEmbed);
        }
        break;
      }
      case 'url':
      case 'snap': {
        if (embed.metadata) {
          urls.push(embed.metadata);
        }
        break;
      }
      case 'cast':
        break;
    }
  }

  return { images, videos, urls, unknowns: [] };
}

/**
 * Await in-flight upload promises for media entries and return ordered submit
 * URLs. Throws if any awaited upload promise rejects or an entry is in a
 * failed state. Entries that have been removed between enqueue and submission
 * are not in the array, so callers should pass the snapshot at submit time.
 */
export async function getEmbedsToSubmit(
  embeds: CastComposerEmbed[],
  { includeTextEmbeds = true }: { includeTextEmbeds?: boolean } = {},
): Promise<string[]> {
  const results: string[] = [];

  for (const embed of embeds) {
    if (embed.kind === 'cast') {
      results.push(embed.hash);
      continue;
    }

    if (
      !includeTextEmbeds &&
      (embed.kind === 'url' || embed.kind === 'snap') &&
      embed.source === 'text'
    ) {
      continue;
    }

    if (embed.kind === 'image') {
      if (embed.uploadStatus === 'failed') {
        throw new Error(
          `Image upload failed for embed ${embed.id}: ${embed.uploadError ?? 'unknown error'}`,
        );
      }
      if (embed.uploadPromise) {
        await embed.uploadPromise;
      }
      if (embed.uploadStatus === 'uploading' && !embed.uploadPromise) {
        throw new Error(`Image upload still in progress for embed ${embed.id}`);
      }
      if (embed.url) {
        results.push(embed.url);
      }
      continue;
    }

    if (embed.kind === 'video') {
      if (embed.uploadStatus === 'failed') {
        throw new Error(
          `Video upload failed for embed ${embed.id}: ${embed.uploadError ?? 'unknown error'}`,
        );
      }
      if (embed.uploadPromise) {
        await embed.uploadPromise;
      }
      if (embed.uploadStatus === 'uploading') {
        throw new Error(`Video upload still in progress for embed ${embed.id}`);
      }
      if (embed.url) {
        results.push(embed.url);
      }
      continue;
    }

    // url / snap
    if ('url' in embed && embed.url) {
      results.push(embed.url);
    }
  }

  return results;
}
