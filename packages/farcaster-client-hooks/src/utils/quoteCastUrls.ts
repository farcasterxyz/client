import {
  ApiCastEmbeds,
  ApiCastUrlEmbed,
  ApiQuoteCastEmbed,
  getCastURL,
  getDeprecatedCastURL,
} from 'farcaster-client-data';

const normalizeUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    return parsed.toString();
  } catch {
    return url.replace(/\/+$/, '');
  }
};

const buildQuoteCastUrlSet = ({ quotes }: { quotes: ApiQuoteCastEmbed[] }) => {
  const urlSet = new Set<string>();

  for (const quote of quotes) {
    const canonicalConversationUrl = `https://farcaster.xyz/~/conversations/${quote.hash}`;
    const deprecatedConversationUrl = `https://warpcast.com/~/conversations/${quote.hash}`;

    for (const url of [canonicalConversationUrl, deprecatedConversationUrl]) {
      urlSet.add(url);
      urlSet.add(normalizeUrl(url));
    }

    const username = quote.author?.username;
    if (!username) {
      continue;
    }

    const canonicalCastUrl = getCastURL({
      castUsername: username,
      castHash: quote.hash,
    });
    const deprecatedCastUrl = getDeprecatedCastURL({
      castUsername: username,
      castHash: quote.hash,
    });

    for (const url of [canonicalCastUrl, deprecatedCastUrl]) {
      urlSet.add(url);
      urlSet.add(normalizeUrl(url));
    }
  }

  return urlSet;
};

const addRequestedUrlsToQuoteCastUrlSet = ({
  quoteCastUrls,
  requestedUrls,
}: {
  quoteCastUrls: Set<string>;
  requestedUrls?: string[];
}) => {
  for (const requested of requestedUrls ?? []) {
    quoteCastUrls.add(requested);
    quoteCastUrls.add(normalizeUrl(requested));
  }
};

const isQuoteCastUrl = ({
  url,
  sourceUrl,
  quoteCastUrls,
}: {
  url: string;
  sourceUrl?: string;
  quoteCastUrls: Set<string>;
}) => {
  if (quoteCastUrls.has(url) || quoteCastUrls.has(normalizeUrl(url))) {
    return true;
  }

  if (!sourceUrl) {
    return false;
  }

  return (
    quoteCastUrls.has(sourceUrl) || quoteCastUrls.has(normalizeUrl(sourceUrl))
  );
};

function urlEmbedMatchesQuoteCast({
  urlEmbed,
  quotes,
  quoteCastUrls,
}: {
  urlEmbed: ApiCastUrlEmbed;
  quotes: ApiQuoteCastEmbed[];
  quoteCastUrls: Set<string>;
}): boolean {
  if (
    isQuoteCastUrl({
      url: urlEmbed.openGraph.url,
      sourceUrl: urlEmbed.openGraph.sourceUrl,
      quoteCastUrls,
    })
  ) {
    return true;
  }

  const blob =
    `${urlEmbed.openGraph.url} ${urlEmbed.openGraph.sourceUrl ?? ''}`.toLowerCase();
  for (const quote of quotes) {
    const fullHash = quote.hash.toLowerCase();
    const hashPrefix = fullHash.slice(0, 10);
    if (blob.includes(fullHash) || blob.includes(hashPrefix)) {
      return true;
    }
  }

  return false;
}

/** Drop URL/link-preview rows superseded by `embeds.casts` quote previews. */
function stripQuoteCastUrlEmbeds(
  embeds: ApiCastEmbeds,
  { requestedUrls }: { requestedUrls?: string[] } = {},
): ApiCastEmbeds {
  const quotes = embeds.casts ?? [];
  if (quotes.length === 0) {
    return embeds;
  }

  const quoteCastUrls = buildQuoteCastUrlSet({ quotes });
  addRequestedUrlsToQuoteCastUrlSet({ quoteCastUrls, requestedUrls });

  const urls = (embeds.urls ?? []).filter(
    (urlEmbed) =>
      !urlEmbedMatchesQuoteCast({ urlEmbed, quotes, quoteCastUrls }),
  );

  return { ...embeds, urls };
}

export {
  addRequestedUrlsToQuoteCastUrlSet,
  buildQuoteCastUrlSet,
  isQuoteCastUrl,
  stripQuoteCastUrlEmbeds,
  urlEmbedMatchesQuoteCast,
};
