import {
  type CastComposerEmbed,
  type CastComposerEmbedsMap,
  dedupeUrlSnapEmbedsPreserveOrder,
  embedUrlsForCast,
  normalizeComposerEmbedUrl,
} from './castComposerEmbedHelpers';
import type {
  CastComposerEmbedsPerCast,
  CastComposerImageEmbed,
  CastComposerImageEmbedV1,
  CastComposerImageEmbedV2,
  CastComposerUrlEmbed,
  CastComposerVideoEmbed,
} from './castComposerEmbedStore';

function collectCastLocalKeys(
  ...sources: Array<Record<number, unknown> | readonly number[] | undefined>
): number[] {
  const keys = new Set<number>();

  for (const source of sources) {
    if (!source) {
      continue;
    }

    if (Array.isArray(source)) {
      for (const key of source) {
        keys.add(key);
      }
      continue;
    }

    for (const keyStr of Object.keys(source)) {
      keys.add(Number(keyStr));
    }
  }

  return Array.from(keys);
}

export function buildCastComposerBucketView(
  canonicalEmbeds: CastComposerEmbedsMap,
  castLocalKeys: readonly number[] = [],
): CastComposerEmbedsPerCast {
  const result: CastComposerEmbedsPerCast = {};

  for (const castLocalKey of collectCastLocalKeys(
    canonicalEmbeds,
    castLocalKeys,
  )) {
    const arr = dedupeUrlSnapEmbedsPreserveOrder(
      canonicalEmbeds[castLocalKey] ?? [],
    );

    result[castLocalKey] = {
      images: arr
        .filter(
          (e): e is Extract<CastComposerEmbed, { kind: 'image' }> =>
            e.kind === 'image' && Boolean(e.url),
        )
        .map((e): CastComposerImageEmbed => {
          if (e.uploadPromise) {
            return {
              version: 'v2',
              localUriRef: e.localUriRef ?? e.url!,
              previewUrl: e.previewUrl ?? e.url!,
              uploadPromise: e.uploadPromise,
              uploadStatus: e.uploadStatus,
              url: e.url!,
              aspectRatio: e.aspectRatio ?? 1,
            } satisfies CastComposerImageEmbedV2;
          }
          return {
            version: 'v1',
            url: e.url!,
            imageDeleteHash: e.imageDeleteHash ?? '*',
          } satisfies CastComposerImageEmbedV1;
        }),
      videos: arr
        .filter(
          (e): e is Extract<CastComposerEmbed, { kind: 'video' }> =>
            e.kind === 'video' && Boolean(e.url),
        )
        .map(
          (e): CastComposerVideoEmbed => ({
            localUriRef: e.localUriRef,
            url: e.url!,
            videoId: e.videoId ?? 'draft-video-id',
            width: e.width,
            height: e.height,
            thumbnailUrl: e.thumbnailUrl,
          }),
        ),
      urls: arr
        .filter(
          (e): e is Extract<CastComposerEmbed, { kind: 'url' | 'snap' }> =>
            e.kind === 'url' || e.kind === 'snap',
        )
        .map((e): CastComposerUrlEmbed => ({ url: e.url })),
    };
  }

  return result;
}

export function buildEmbedUrlsByCast({
  canonicalEmbeds,
  extraUrlsByCast = {},
  includeTextEmbeds = true,
  castLocalKeys = [],
}: {
  canonicalEmbeds: CastComposerEmbedsMap;
  extraUrlsByCast?: { [castLocalKey: number]: string[] };
  includeTextEmbeds?: boolean;
  castLocalKeys?: readonly number[];
}): { [castLocalKey: number]: string[] } {
  const embedUrlsPerCast: { [castLocalKey: number]: string[] } = {};

  for (const castLocalKey of collectCastLocalKeys(
    canonicalEmbeds,
    extraUrlsByCast,
    castLocalKeys,
  )) {
    const arr = canonicalEmbeds[castLocalKey] ?? [];

    // Dedupe by normalized key (so trailing-slash variants of the same URL
    // don't consume two embed slots or get persisted twice) while preserving
    // the first-seen raw value so callers see the URL the user actually
    // entered. Cast hashes are non-URLs; `normalizeComposerEmbedUrl` falls
    // back to a trimmed string for them, which is the correct dedupe key.
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const u of [
      ...embedUrlsForCast(arr, { includeTextEmbeds }),
      ...(extraUrlsByCast[castLocalKey] ?? []),
    ]) {
      const key = normalizeComposerEmbedUrl(u);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      urls.push(u);
    }

    embedUrlsPerCast[castLocalKey] = urls;
  }

  return embedUrlsPerCast;
}

export function getMediaEmbedUrlsForCast({
  canonicalEmbeds,
  castLocalKey,
}: {
  canonicalEmbeds: CastComposerEmbedsMap;
  castLocalKey: number;
}): string[] {
  return (canonicalEmbeds[castLocalKey] ?? [])
    .filter(
      (e): e is Extract<CastComposerEmbed, { kind: 'image' | 'video' }> =>
        e.kind === 'image' || e.kind === 'video',
    )
    .map((e) => e.url)
    .filter((url): url is string => Boolean(url));
}

export function getSnapEmbedUrlsForCast({
  canonicalEmbeds,
  castLocalKey,
}: {
  canonicalEmbeds: CastComposerEmbedsMap;
  castLocalKey: number;
}): string[] {
  return (canonicalEmbeds[castLocalKey] ?? [])
    .filter(
      (e): e is Extract<CastComposerEmbed, { kind: 'snap' }> =>
        e.kind === 'snap',
    )
    .map((e) => e.url);
}
