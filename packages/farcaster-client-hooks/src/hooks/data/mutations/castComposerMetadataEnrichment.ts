import type { ApiCastUrlEmbed } from 'farcaster-client-data';

import {
  normalizeComposerEmbedUrl,
  requestedUrlMatchesUrlEmbed,
} from './castComposerEmbedHelpers';

export function filterCrawlableUrlEmbeds(
  urlEmbeds: ApiCastUrlEmbed[],
): ApiCastUrlEmbed[] {
  // Filter out Solana CA URLs that don't carry token metadata. Those entries
  // are crawl placeholders rather than useful previews, and the requested-URL
  // projection below handles deduping the remaining crawl results.
  return urlEmbeds.filter((embed) => {
    const embedUrl = embed.openGraph.url;
    return !(
      (embedUrl.startsWith('https://warpcast.com/~/ca/') ||
        embedUrl.startsWith('https://farcaster.xyz/~/ca/')) &&
      typeof embed.token === 'undefined'
    );
  });
}

export function findMissingOrIncompleteRequestedUrls({
  requestedUrls,
  urlEmbeds,
}: {
  requestedUrls: string[];
  urlEmbeds: ApiCastUrlEmbed[];
}): string[] {
  // A URL is "missing" if either:
  //   (a) the crawl returned no embed at all for it (API couldn't reach or
  //       resolve the URL — common for localhost URLs, fresh publishes, or
  //       app-internal URLs), or
  //   (b) the returned embed has no usable OG/frame metadata.
  //
  // Consumers can then synthesize fallback embeds for those cases (e.g. a snap
  // embed for a URL the composer just published).
  return requestedUrls.filter((url) => {
    const entry = urlEmbeds.find((embed) =>
      requestedUrlMatchesUrlEmbed(url, embed),
    );
    if (!entry) {
      return true;
    }
    return isUrlEmbedIncomplete(entry);
  });
}

function isUrlEmbedIncomplete(entry: ApiCastUrlEmbed): boolean {
  return (
    (typeof entry.openGraph.title === 'undefined' ||
      entry.openGraph.title.trim() === '' ||
      typeof entry.openGraph.description === 'undefined' ||
      entry.openGraph.description.trim() === '') &&
    typeof entry.openGraph.frame === 'undefined' &&
    typeof entry.openGraph.frameDebug === 'undefined' &&
    typeof entry.openGraph.frameEmbedNext === 'undefined'
  );
}

export function projectUrlEmbedsForRequestedUrls({
  requestedUrls,
  crawledUrlEmbeds,
  fallbackUrlEmbeds,
}: {
  requestedUrls: string[];
  crawledUrlEmbeds: ApiCastUrlEmbed[];
  fallbackUrlEmbeds?: ApiCastUrlEmbed[];
}): ApiCastUrlEmbed[] {
  const fallbackEmbeds = fallbackUrlEmbeds ?? [];
  const out: ApiCastUrlEmbed[] = [];
  const seenRequestedUrls = new Set<string>();

  for (const requestedUrl of requestedUrls) {
    const requestedKey = normalizeComposerEmbedUrl(requestedUrl);
    if (seenRequestedUrls.has(requestedKey)) {
      continue;
    }
    seenRequestedUrls.add(requestedKey);

    const crawled = crawledUrlEmbeds.find((embed) =>
      requestedUrlMatchesUrlEmbed(requestedUrl, embed),
    );
    const fallback = fallbackEmbeds.find((embed) =>
      requestedUrlMatchesUrlEmbed(requestedUrl, embed),
    );

    const match =
      crawled && !isUrlEmbedIncomplete(crawled)
        ? crawled
        : (fallback ?? crawled);

    if (match) {
      out.push(match);
    }
  }

  return out;
}
