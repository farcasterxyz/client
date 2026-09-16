import {
  type ApiCastImageEmbed,
  type ApiCastUrlEmbed,
  type ApiCastVideoEmbed,
  type ApiQuoteCastEmbed,
  getCastURL,
  getDeprecatedCastURL,
} from 'farcaster-client-data';

import {
  type CastComposerEmbed,
  requestedUrlMatchesUrlEmbed,
} from './castComposerEmbedHelpers';

export type DraftHydratedMedia = {
  images: ApiCastImageEmbed[];
  videos: ApiCastVideoEmbed[];
  urls: ApiCastUrlEmbed[];
  casts?: ApiQuoteCastEmbed[];
};

export function filterDraftUrlEmbeds({
  images,
  videos,
  urls,
  casts = [],
}: DraftHydratedMedia): ApiCastUrlEmbed[] {
  const castUrls = new Set(
    casts.flatMap((cast) => [
      getCastURL({
        castUsername: cast.author.username,
        castHash: cast.hash,
      }),
      getDeprecatedCastURL({
        castUsername: cast.author.username,
        castHash: cast.hash,
      }),
    ]),
  );

  // API draft hydration groups media URLs into both media buckets and URL
  // previews. Keep only true URL previews here so draft restore doesn't render
  // a duplicate URL card for a media attachment or quoted cast.
  return urls.filter(
    (o) =>
      images.findIndex((image) => o.openGraph.url === image.sourceUrl) === -1 &&
      videos.findIndex((video) => o.openGraph.url === video.sourceUrl) === -1 &&
      !castUrls.has(o.openGraph.url),
  );
}

export function buildCanonicalEmbedsFromDraft({
  embeds,
  images,
  videos,
  urls,
  casts = [],
  nextEmbedId,
}: {
  embeds: string[];
  images: ApiCastImageEmbed[];
  videos: ApiCastVideoEmbed[];
  urls: ApiCastUrlEmbed[];
  casts?: ApiQuoteCastEmbed[];
  nextEmbedId: () => string;
}): CastComposerEmbed[] {
  // Build ordered canonical entries from the original persisted embeds[] input,
  // not from the grouped API response, to preserve draft attachment order.
  return embeds
    .map((inputUrl): CastComposerEmbed | null => {
      const cast = casts.find(
        (c) =>
          c.hash === inputUrl ||
          getCastURL({
            castUsername: c.author.username,
            castHash: c.hash,
          }) === inputUrl ||
          getDeprecatedCastURL({
            castUsername: c.author.username,
            castHash: c.hash,
          }) === inputUrl,
      );
      if (cast) {
        return {
          id: nextEmbedId(),
          kind: 'cast',
          hash: cast.hash,
        } satisfies Extract<CastComposerEmbed, { kind: 'cast' }>;
      }

      const img = images.find(
        (i) => i.url === inputUrl || i.sourceUrl === inputUrl,
      );
      if (img) {
        return {
          id: nextEmbedId(),
          kind: 'image',
          url: img.url,
          uploadStatus: 'uploaded',
          width: img.media?.width,
          height: img.media?.height,
          apiImageEmbed: img,
        } satisfies Extract<CastComposerEmbed, { kind: 'image' }>;
      }

      const vid = videos.find(
        (v) => v.url === inputUrl || v.sourceUrl === inputUrl,
      );
      if (vid) {
        return {
          id: nextEmbedId(),
          kind: 'video',
          url: vid.url,
          localUriRef: vid.sourceUrl,
          videoId: 'draft-video-id',
          width: vid.width || 1000,
          height: vid.height || 1000,
          thumbnailUrl: vid.thumbnailUrl,
          uploadStatus: 'uploaded',
          apiVideoEmbed: vid,
        } satisfies Extract<CastComposerEmbed, { kind: 'video' }>;
      }

      const urlEntry = urls.find((u) =>
        requestedUrlMatchesUrlEmbed(inputUrl, u),
      );
      if (urlEntry) {
        return {
          id: nextEmbedId(),
          kind: 'url',
          url: inputUrl,
          source: 'other',
          metadata: urlEntry,
        } satisfies Extract<CastComposerEmbed, { kind: 'url' }>;
      }

      // URL not classified by the API: preserve it as a non-text URL embed so
      // draft restore never silently drops a persisted attachment.
      return {
        id: nextEmbedId(),
        kind: 'url',
        url: inputUrl,
        source: 'other',
      } satisfies Extract<CastComposerEmbed, { kind: 'url' }>;
    })
    .filter((e): e is CastComposerEmbed => e !== null);
}
