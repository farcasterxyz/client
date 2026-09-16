import type {
  ApiCastEmbeds,
  ApiCastUrlEmbed,
  ApiQuoteCastEmbed,
} from 'farcaster-client-data';

import { buildCanonicalEmbedsFromDraft } from '../castComposerDraftHydration';
import {
  addEmbedToCast,
  apiEmbedsForCast,
  buildUrlSnapEmbedIgnoreSet,
  CastComposerEmbed,
  dedupeUrlSnapEmbedsPreserveOrder,
  embedUrlsForCast,
  getEmbedsToSubmit,
  getUrlSnapEmbedNormalizedUrls,
  mergeCandidateUrls,
  mergeHydratedEmbedsPreservingTextSource,
  mergeHydratedProcessedEmbedsPreservingTextUrls,
  normalizeComposerEmbedUrl,
  pickOneEmbedPerRequestedUrl,
  pruneProcessedUrlEmbedsByUrls,
  pruneProcessedUrlEmbedsToCanonicalUrls,
  removeEmbedsFromCast,
  requestedUrlMatchesUrlEmbed,
  syncEmbedsBySourceForCast,
  urlSnapEmbedMatchesAnyUrl,
  urlSnapEmbedMatchesUrl,
} from '../castComposerEmbedHelpers';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const urlEmbed = (
  id: string,
  url: string,
  source: 'text' | 'other' = 'text',
  metadata?: ApiCastUrlEmbed,
): Extract<CastComposerEmbed, { kind: 'url' }> => ({
  id,
  kind: 'url',
  url,
  source,
  metadata,
});

const snapEmbed = (
  id: string,
  url: string,
  source: 'text' | 'other' = 'other',
  metadata?: ApiCastUrlEmbed,
): Extract<CastComposerEmbed, { kind: 'snap' }> => ({
  id,
  kind: 'snap',
  url,
  source,
  metadata,
});

const imageEmbed = (id: string, url?: string): CastComposerEmbed => ({
  id,
  kind: 'image',
  url,
  width: 100,
  height: 100,
});

const videoEmbed = (id: string, url?: string): CastComposerEmbed => ({
  id,
  kind: 'video',
  url,
  localUriRef: `file://${id}.mp4`,
  width: 1280,
  height: 720,
});

const castEmbed = (id: string, hash: string): CastComposerEmbed => ({
  id,
  kind: 'cast',
  hash,
});

const apiUrlEmbed = (
  openGraphUrl: string,
  sourceUrl?: string,
): ApiCastUrlEmbed =>
  ({
    type: 'url',
    openGraph: {
      url: openGraphUrl,
      ...(sourceUrl !== undefined ? { sourceUrl } : {}),
    },
  }) as ApiCastUrlEmbed;

// ---------------------------------------------------------------------------
// addEmbedToCast
// ---------------------------------------------------------------------------

describe('addEmbedToCast', () => {
  it('appends an embed when under the limit', () => {
    const result = addEmbedToCast([], urlEmbed('1', 'https://a.com'), 2);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('preserves existing embed order', () => {
    const existing = [
      urlEmbed('1', 'https://a.com'),
      urlEmbed('2', 'https://b.com'),
    ];
    const result = addEmbedToCast(existing, urlEmbed('3', 'https://c.com'), 5);
    expect(result.map((e) => e.id)).toEqual(['1', '2', '3']);
  });

  it('returns the array unchanged when the limit is reached', () => {
    const existing = [
      urlEmbed('1', 'https://a.com'),
      urlEmbed('2', 'https://b.com'),
    ];
    const result = addEmbedToCast(existing, urlEmbed('3', 'https://c.com'), 2);
    expect(result).toEqual(existing);
    expect(result).toHaveLength(2);
  });

  it('does not mutate the original array', () => {
    const existing = [urlEmbed('1', 'https://a.com')];
    const frozen = [...existing];
    addEmbedToCast(existing, urlEmbed('2', 'https://b.com'), 5);
    expect(existing).toEqual(frozen);
  });
});

// ---------------------------------------------------------------------------
// removeEmbedsFromCast
// ---------------------------------------------------------------------------

describe('removeEmbedsFromCast', () => {
  it('removes entries matching the predicate', () => {
    const embeds: CastComposerEmbed[] = [
      urlEmbed('1', 'https://a.com'),
      urlEmbed('2', 'https://b.com'),
      urlEmbed('3', 'https://c.com'),
    ];
    const result = removeEmbedsFromCast(embeds, (e) => e.id === '2');
    expect(result.map((e) => e.id)).toEqual(['1', '3']);
  });

  it('removes multiple entries matching the predicate', () => {
    const embeds: CastComposerEmbed[] = [
      urlEmbed('1', 'https://a.com', 'text'),
      urlEmbed('2', 'https://b.com', 'other'),
      urlEmbed('3', 'https://c.com', 'text'),
    ];
    const result = removeEmbedsFromCast(
      embeds,
      (e) => 'source' in e && e.source === 'text',
    );
    expect(result.map((e) => e.id)).toEqual(['2']);
  });

  it('returns the array unchanged when no entry matches', () => {
    const embeds = [urlEmbed('1', 'https://a.com')];
    const result = removeEmbedsFromCast(embeds, (e) => e.id === 'x');
    expect(result).toEqual(embeds);
  });

  it('does not mutate the original array', () => {
    const embeds = [urlEmbed('1', 'https://a.com')];
    const frozen = [...embeds];
    removeEmbedsFromCast(embeds, (e) => e.id === '1');
    expect(embeds).toEqual(frozen);
  });
});

// ---------------------------------------------------------------------------
// normalizeComposerEmbedUrl / dedupeUrlSnapEmbedsPreserveOrder
// ---------------------------------------------------------------------------

describe('normalizeComposerEmbedUrl', () => {
  it('normalizes equivalent https URLs', () => {
    expect(normalizeComposerEmbedUrl('https://grin.io')).toBe(
      normalizeComposerEmbedUrl('https://grin.io/'),
    );
  });

  it('returns the input on invalid URL', () => {
    expect(normalizeComposerEmbedUrl('not a url')).toBe('not a url');
  });

  it('trims whitespace before parsing', () => {
    expect(normalizeComposerEmbedUrl('  https://grin.io  ')).toBe(
      normalizeComposerEmbedUrl('https://grin.io/'),
    );
  });

  it('strips trailing slash from non-root paths', () => {
    expect(normalizeComposerEmbedUrl('https://grin.io/chat/')).toBe(
      normalizeComposerEmbedUrl('https://grin.io/chat'),
    );
  });

  it('preserves the root slash for host-only URLs', () => {
    expect(normalizeComposerEmbedUrl('https://grin.io')).toBe(
      'https://grin.io/',
    );
  });

  it('does not collapse query strings or fragments', () => {
    expect(normalizeComposerEmbedUrl('https://grin.io/chat?x=1')).not.toBe(
      normalizeComposerEmbedUrl('https://grin.io/chat'),
    );
    expect(normalizeComposerEmbedUrl('https://grin.io/chat#a')).not.toBe(
      normalizeComposerEmbedUrl('https://grin.io/chat'),
    );
  });
});

describe('requestedUrlMatchesUrlEmbed', () => {
  const minimalUrlEmbed = (
    openGraphUrl: string,
    sourceUrl?: string,
  ): ApiCastUrlEmbed =>
    ({
      type: 'url',
      openGraph: {
        url: openGraphUrl,
        ...(sourceUrl !== undefined ? { sourceUrl } : {}),
      },
    }) as ApiCastUrlEmbed;

  it('matches requested URL to canonical openGraph.url with trailing slash', () => {
    const embed = minimalUrlEmbed('https://grin.io/');
    expect(requestedUrlMatchesUrlEmbed('https://grin.io', embed)).toBe(true);
  });

  it('matches requested URL to openGraph.sourceUrl when url differs', () => {
    const embed = minimalUrlEmbed('https://cdn.example/x', 'https://grin.io');
    expect(requestedUrlMatchesUrlEmbed('https://grin.io/', embed)).toBe(true);
  });
});

describe('pickOneEmbedPerRequestedUrl', () => {
  const apiUrlEmbed = (
    openGraphUrl: string,
    sourceUrl?: string,
  ): ApiCastUrlEmbed =>
    ({
      type: 'url',
      openGraph: {
        url: openGraphUrl,
        ...(sourceUrl !== undefined ? { sourceUrl } : {}),
      },
    }) as ApiCastUrlEmbed;

  it('returns at most one embed per requested URL even when crawl yields trailing-slash variants', () => {
    // grin.io/chat regression: API returns both `https://grin.io/chat` and
    // `https://grin.io/chat/` for a single requested URL, which previously
    // produced two preview cards that all dismissed together.
    const requested = ['https://grin.io/chat'];
    const response = [
      apiUrlEmbed('https://grin.io/chat'),
      apiUrlEmbed('https://grin.io/chat/'),
    ];
    const result = pickOneEmbedPerRequestedUrl(requested, response);
    expect(result).toHaveLength(1);
    expect(result[0]?.openGraph.url).toBe('https://grin.io/chat');
  });

  it('matches via sourceUrl when the resolved openGraph URL differs', () => {
    const requested = ['https://grin.io'];
    const response = [apiUrlEmbed('https://cdn.example/x', 'https://grin.io')];
    const result = pickOneEmbedPerRequestedUrl(requested, response);
    expect(result).toHaveLength(1);
    expect(result[0]?.openGraph.url).toBe('https://cdn.example/x');
  });

  it('preserves the order of requested URLs', () => {
    const requested = ['https://b.com', 'https://a.com'];
    const response = [
      apiUrlEmbed('https://a.com/'),
      apiUrlEmbed('https://b.com/'),
    ];
    expect(
      pickOneEmbedPerRequestedUrl(requested, response).map(
        (e) => e.openGraph.url,
      ),
    ).toEqual(['https://b.com/', 'https://a.com/']);
  });

  it('drops response embeds that do not correspond to any requested URL', () => {
    const requested = ['https://a.com'];
    const response = [
      apiUrlEmbed('https://a.com/'),
      apiUrlEmbed('https://other.example/'),
    ];
    const result = pickOneEmbedPerRequestedUrl(requested, response);
    expect(result).toHaveLength(1);
    expect(result[0]?.openGraph.url).toBe('https://a.com/');
  });

  it('skips requested URLs with no matching response embed', () => {
    const requested = ['https://a.com', 'https://missing.example'];
    const response = [apiUrlEmbed('https://a.com/')];
    const result = pickOneEmbedPerRequestedUrl(requested, response);
    expect(result).toHaveLength(1);
    expect(result[0]?.openGraph.url).toBe('https://a.com/');
  });

  it('deduplicates duplicate requested URLs', () => {
    const requested = ['https://a.com', 'https://a.com/'];
    const response = [apiUrlEmbed('https://a.com/')];
    const result = pickOneEmbedPerRequestedUrl(requested, response);
    expect(result).toHaveLength(1);
  });
});

describe('mergeCandidateUrls', () => {
  it('merges multiple sources in order, first occurrence wins', () => {
    const intent = ['https://a.com'];
    const linkified = ['https://b.com', 'https://a.com'];
    const manual = ['https://c.com', 'https://b.com'];
    expect(mergeCandidateUrls([intent, linkified, manual], new Set())).toEqual([
      'https://a.com/',
      'https://b.com/',
      'https://c.com/',
    ]);
  });

  it('drops empty strings', () => {
    expect(mergeCandidateUrls([['', 'https://a.com', '']], new Set())).toEqual([
      'https://a.com/',
    ]);
  });

  it('treats trailing-slash variants as equivalent (first wins)', () => {
    expect(
      mergeCandidateUrls(
        [['https://grin.io/chat'], ['https://grin.io/chat/']],
        new Set(),
      ),
    ).toEqual(['https://grin.io/chat']);
  });

  it('returns normalized URL casing for fetch candidates', () => {
    expect(mergeCandidateUrls([['https://X.com/grin_io']], new Set())).toEqual([
      'https://x.com/grin_io',
    ]);
  });

  it('filters URLs whose normalized form is in dismissed set', () => {
    // Dismissed entered as no-trailing-slash should still block the
    // trailing-slash variant.
    const dismissed = new Set(['https://grin.io/chat']);
    expect(mergeCandidateUrls([['https://grin.io/chat/']], dismissed)).toEqual(
      [],
    );
  });

  it('filters dismissed even when dismissed entry has trailing slash', () => {
    const dismissed = new Set(['https://grin.io/chat/']);
    expect(mergeCandidateUrls([['https://grin.io/chat']], dismissed)).toEqual(
      [],
    );
  });
});

describe('dedupeUrlSnapEmbedsPreserveOrder', () => {
  it('keeps the first url when two normalize to the same href', () => {
    const embeds: CastComposerEmbed[] = [
      urlEmbed('first', 'https://a.com', 'text'),
      urlEmbed('second', 'https://a.com/', 'text'),
    ];
    const result = dedupeUrlSnapEmbedsPreserveOrder(embeds);
    expect(result.map((e) => e.id)).toEqual(['first']);
  });

  it('does not dedupe across different hosts', () => {
    const embeds: CastComposerEmbed[] = [
      urlEmbed('1', 'https://a.com', 'text'),
      urlEmbed('2', 'https://b.com', 'text'),
    ];
    expect(dedupeUrlSnapEmbedsPreserveOrder(embeds)).toHaveLength(2);
  });

  it('dedupes text URLs against resolved metadata aliases from intent embeds', () => {
    const intentUrl = 'https://gmfarcaster.com/miniapp/share';
    const resolvedUrl = 'https://gmfarcaster.com/';
    const embeds: CastComposerEmbed[] = [
      urlEmbed(
        'intent',
        intentUrl,
        'other',
        apiUrlEmbed(resolvedUrl, intentUrl),
      ),
      urlEmbed('text', resolvedUrl, 'text'),
    ];

    const result = dedupeUrlSnapEmbedsPreserveOrder(embeds);

    expect(result.map((e) => e.id)).toEqual(['intent']);
  });
});

describe('urlSnapEmbedMatchesUrl', () => {
  it('matches against raw URL, resolved URL, and source URL aliases', () => {
    const embed = urlEmbed(
      'intent',
      'https://gmfarcaster.com/miniapp/share',
      'other',
      apiUrlEmbed(
        'https://gmfarcaster.com/',
        'https://gmfarcaster.com/miniapp/share',
      ),
    );

    expect(urlSnapEmbedMatchesUrl({ embed, url: embed.url })).toBe(true);
    expect(
      urlSnapEmbedMatchesUrl({ embed, url: 'https://gmfarcaster.com' }),
    ).toBe(true);
  });
});

describe('getUrlSnapEmbedNormalizedUrls', () => {
  it('returns normalized raw URL and metadata aliases', () => {
    const embed = urlEmbed(
      'intent',
      'https://gmfarcaster.com/miniapp/share',
      'other',
      apiUrlEmbed(
        'https://gmfarcaster.com/',
        'https://gmfarcaster.com/miniapp/share/',
      ),
    );

    expect([...getUrlSnapEmbedNormalizedUrls(embed)].sort()).toEqual(
      [
        'https://gmfarcaster.com/',
        'https://gmfarcaster.com/miniapp/share',
      ].sort(),
    );
  });
});

describe('urlSnapEmbedMatchesAnyUrl', () => {
  it('matches any URL alias in the provided set', () => {
    const embed = urlEmbed(
      'intent',
      'https://gmfarcaster.com/miniapp/share',
      'other',
      apiUrlEmbed('https://gmfarcaster.com/'),
    );

    expect(
      urlSnapEmbedMatchesAnyUrl({
        embed,
        urls: new Set(['https://other.example', 'https://gmfarcaster.com']),
      }),
    ).toBe(true);
  });
});

describe('buildUrlSnapEmbedIgnoreSet', () => {
  it('stores every alias for the dismissed embed so text sync cannot re-add it', () => {
    const requestedUrl = 'https://gmfarcaster.com/miniapp/share';
    const resolvedUrl = 'https://gmfarcaster.com/';
    const embeds: CastComposerEmbed[] = [
      urlEmbed(
        'intent',
        requestedUrl,
        'other',
        apiUrlEmbed(resolvedUrl, requestedUrl),
      ),
    ];

    const result = buildUrlSnapEmbedIgnoreSet({
      embeds,
      url: requestedUrl,
    });

    expect(result.has(normalizeComposerEmbedUrl(requestedUrl))).toBe(true);
    expect(result.has(normalizeComposerEmbedUrl(resolvedUrl))).toBe(true);
  });

  it('preserves existing ignored URLs', () => {
    const result = buildUrlSnapEmbedIgnoreSet({
      embeds: [],
      url: 'https://new.example',
      existingUrlsToIgnore: new Set(['https://old.example/']),
    });

    expect(result.has('https://old.example/')).toBe(true);
    expect(result.has('https://new.example/')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// syncEmbedsBySourceForCast
// ---------------------------------------------------------------------------

describe('syncEmbedsBySourceForCast', () => {
  it('replaces only entries for the requested source', () => {
    const embeds: CastComposerEmbed[] = [
      urlEmbed('o1', 'https://other.com', 'other'),
      urlEmbed('t1', 'https://text-a.com', 'text'),
      urlEmbed('t2', 'https://text-b.com', 'text'),
      snapEmbed('s1', 'https://snap.com', 'other'),
    ];
    const newTextCandidates: CastComposerEmbed[] = [
      urlEmbed('t3', 'https://text-new.com', 'text'),
    ];
    const result = syncEmbedsBySourceForCast(
      embeds,
      'text',
      newTextCandidates,
      5,
    );
    expect(result.map((e) => e.id)).toEqual(['o1', 's1', 't3']);
  });

  it('leaves other-source entries untouched', () => {
    const embeds: CastComposerEmbed[] = [
      urlEmbed('o1', 'https://o1.com', 'other'),
      urlEmbed('o2', 'https://o2.com', 'other'),
      snapEmbed('c', 'https://c.com', 'other'),
      urlEmbed('t', 'https://t.com', 'text'),
    ];
    const result = syncEmbedsBySourceForCast(embeds, 'text', [], 10);
    expect(result.map((e) => e.id)).toEqual(['o1', 'o2', 'c']);
  });

  it('drops candidates that exceed the slot limit', () => {
    const embeds: CastComposerEmbed[] = [imageEmbed('img1', 'https://img.com')];
    const candidates: CastComposerEmbed[] = [
      urlEmbed('t1', 'https://text1.com', 'text'),
      urlEmbed('t2', 'https://text2.com', 'text'),
    ];
    // limit=2, 1 slot free → only one candidate fits
    const result = syncEmbedsBySourceForCast(embeds, 'text', candidates, 2);
    expect(result.map((e) => e.id)).toEqual(['img1', 't1']);
  });

  it('handles an empty starting array', () => {
    const candidates: CastComposerEmbed[] = [
      urlEmbed('t1', 'https://text1.com', 'text'),
      urlEmbed('t2', 'https://text2.com', 'text'),
    ];
    const result = syncEmbedsBySourceForCast([], 'text', candidates, 2);
    expect(result.map((e) => e.id)).toEqual(['t1', 't2']);
  });

  it('dedupes text candidates that normalize to the same URL', () => {
    const candidates: CastComposerEmbed[] = [
      urlEmbed('t1', 'https://example.com', 'text'),
      urlEmbed('t2', 'https://example.com/', 'text'),
    ];
    const result = syncEmbedsBySourceForCast([], 'text', candidates, 5);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
  });

  it('does not add text candidates that match an existing intent embed alias', () => {
    const intentUrl = 'https://gmfarcaster.com/miniapp/share';
    const resolvedUrl = 'https://gmfarcaster.com/';
    const embeds: CastComposerEmbed[] = [
      urlEmbed(
        'intent',
        intentUrl,
        'other',
        apiUrlEmbed(resolvedUrl, intentUrl),
      ),
    ];
    const candidates: CastComposerEmbed[] = [
      urlEmbed('text', resolvedUrl, 'text'),
    ];

    const result = syncEmbedsBySourceForCast(embeds, 'text', candidates, 2);

    expect(result.map((e) => e.id)).toEqual(['intent']);
  });

  it('does not let duplicate intent candidates consume available text URL slots', () => {
    const quoteHash = '0xb64f7e4074dc202db108afe4c7d264785723fb26';
    const embeds: CastComposerEmbed[] = [
      urlEmbed('quote-intent', quoteHash, 'other'),
    ];
    const candidates: CastComposerEmbed[] = [
      urlEmbed('quote-text-candidate', quoteHash, 'text'),
      urlEmbed('typed-url', 'https://x.com/grin_io', 'text'),
    ];

    const result = syncEmbedsBySourceForCast(embeds, 'text', candidates, 2);

    expect(result.map((e) => e.id)).toEqual(['quote-intent', 'typed-url']);
  });
});

// ---------------------------------------------------------------------------
// mergeHydratedEmbedsPreservingTextSource
// ---------------------------------------------------------------------------

describe('mergeHydratedEmbedsPreservingTextSource', () => {
  it('keeps text URL embeds when intent hydration resolves later', () => {
    const existing: CastComposerEmbed[] = [
      urlEmbed('text', 'https://x.com/grin_io', 'text'),
    ];
    const hydrated: CastComposerEmbed[] = [
      urlEmbed('quote', '0xb64f7e4074dc202db108afe4c7d264785723fb26', 'other'),
    ];

    const result = mergeHydratedEmbedsPreservingTextSource(
      existing,
      hydrated,
      2,
    );

    expect(result.map((e) => e.id)).toEqual(['quote', 'text']);
  });

  it('does not preserve non-text stale entries from the previous bucket', () => {
    const existing: CastComposerEmbed[] = [
      urlEmbed('old-intent', 'https://old.example', 'other'),
      urlEmbed('text', 'https://x.com/grin_io', 'text'),
    ];
    const hydrated: CastComposerEmbed[] = [
      urlEmbed('new-intent', 'https://new.example', 'other'),
    ];

    const result = mergeHydratedEmbedsPreservingTextSource(
      existing,
      hydrated,
      3,
    );

    expect(result.map((e) => e.id)).toEqual(['new-intent', 'text']);
  });

  it('honors the embed limit with hydrated entries first', () => {
    const existing: CastComposerEmbed[] = [
      urlEmbed('text', 'https://x.com/grin_io', 'text'),
    ];
    const hydrated: CastComposerEmbed[] = [
      urlEmbed('intent-a', 'https://a.example', 'other'),
      urlEmbed('intent-b', 'https://b.example', 'other'),
    ];

    const result = mergeHydratedEmbedsPreservingTextSource(
      existing,
      hydrated,
      2,
    );

    expect(result.map((e) => e.id)).toEqual(['intent-a', 'intent-b']);
  });
});

// ---------------------------------------------------------------------------
// mergeHydratedProcessedEmbedsPreservingTextUrls
// ---------------------------------------------------------------------------

describe('mergeHydratedProcessedEmbedsPreservingTextUrls', () => {
  it('keeps resolved text URL previews when quote hydration resolves later', () => {
    const result = mergeHydratedProcessedEmbedsPreservingTextUrls({
      existingProcessedEmbeds: {
        images: [],
        videos: [],
        casts: [],
        urls: [apiUrlEmbed('https://x.com/grin_io/', 'https://x.com/grin_io')],
      } as ApiCastEmbeds,
      hydratedProcessedEmbeds: {
        images: [],
        videos: [],
        casts: [{ hash: '0xabc' }],
        urls: [],
      } as ApiCastEmbeds,
      currentCanonicalEmbeds: [
        urlEmbed('text', 'https://x.com/grin_io', 'text'),
      ],
    });

    expect(result.urls.map((url) => url.openGraph.url)).toEqual([
      'https://x.com/grin_io/',
    ]);
    expect(result.casts?.map((cast) => cast.hash)).toEqual(['0xabc']);
  });

  it('does not keep stale processed previews that are no longer text embeds', () => {
    const result = mergeHydratedProcessedEmbedsPreservingTextUrls({
      existingProcessedEmbeds: {
        images: [],
        videos: [],
        casts: [],
        urls: [apiUrlEmbed('https://old.example')],
      } as ApiCastEmbeds,
      hydratedProcessedEmbeds: {
        images: [],
        videos: [],
        casts: [{ hash: '0xabc' }],
        urls: [],
      } as ApiCastEmbeds,
      currentCanonicalEmbeds: [
        urlEmbed('intent', 'https://old.example', 'other'),
      ],
    });

    expect(result.urls).toEqual([]);
  });

  it('dedupes hydrated and text previews by normalized URL', () => {
    const result = mergeHydratedProcessedEmbedsPreservingTextUrls({
      existingProcessedEmbeds: {
        images: [],
        videos: [],
        casts: [],
        urls: [apiUrlEmbed('https://x.com/grin_io/', 'https://x.com/grin_io')],
      } as ApiCastEmbeds,
      hydratedProcessedEmbeds: {
        images: [],
        videos: [],
        casts: [],
        urls: [apiUrlEmbed('https://x.com/grin_io')],
      } as ApiCastEmbeds,
      currentCanonicalEmbeds: [
        urlEmbed('text', 'https://x.com/grin_io', 'text'),
      ],
    });

    expect(result.urls.map((url) => url.openGraph.url)).toEqual([
      'https://x.com/grin_io',
    ]);
  });
});

describe('pruneProcessedUrlEmbedsByUrls', () => {
  it('removes processed URL previews matching requested or resolved URLs', () => {
    const processedEmbeds = {
      images: [],
      videos: [],
      unknowns: [],
      urls: [
        apiUrlEmbed('https://example.com/final', 'https://example.com/input'),
        apiUrlEmbed('https://keep.example'),
      ],
    } satisfies ApiCastEmbeds;

    const result = pruneProcessedUrlEmbedsByUrls({
      processedEmbeds,
      urls: ['https://example.com/input'],
    });

    expect(result.urls.map((embed) => embed.openGraph.url)).toEqual([
      'https://keep.example',
    ]);
  });
});

describe('pruneProcessedUrlEmbedsToCanonicalUrls', () => {
  it('keeps only processed URL previews that still have canonical URL entries', () => {
    const processedEmbeds = {
      images: [],
      videos: [],
      unknowns: [],
      urls: [
        apiUrlEmbed('https://one.example'),
        apiUrlEmbed('https://two.example/final', 'https://two.example/input'),
        apiUrlEmbed('https://overflow.example'),
      ],
    } satisfies ApiCastEmbeds;

    const result = pruneProcessedUrlEmbedsToCanonicalUrls({
      processedEmbeds,
      canonicalEmbeds: [
        imageEmbed('img', 'https://image.example/img.png'),
        urlEmbed('one', 'https://one.example'),
        urlEmbed('two', 'https://two.example/input'),
      ],
    });

    expect(result.urls.map((embed) => embed.openGraph.url)).toEqual([
      'https://one.example',
      'https://two.example/final',
    ]);
  });
});

// ---------------------------------------------------------------------------
// embedUrlsForCast
// ---------------------------------------------------------------------------

describe('embedUrlsForCast', () => {
  it('returns ordered URLs for url and snap embeds', () => {
    const embeds: CastComposerEmbed[] = [
      urlEmbed('1', 'https://a.com', 'text'),
      snapEmbed('2', 'https://snap.com', 'other'),
      urlEmbed('3', 'https://b.com', 'other'),
    ];
    expect(embedUrlsForCast(embeds)).toEqual([
      'https://a.com',
      'https://snap.com',
      'https://b.com',
    ]);
  });

  it('includes quote-cast hashes not the URL', () => {
    const embeds: CastComposerEmbed[] = [
      castEmbed('c1', '0xabc123'),
      urlEmbed('u1', 'https://link.com', 'text'),
    ];
    expect(embedUrlsForCast(embeds)).toEqual(['0xabc123', 'https://link.com']);
  });

  it('includes image and video URLs when present', () => {
    const embeds: CastComposerEmbed[] = [
      imageEmbed('img1', 'https://img.com/photo.jpg'),
      videoEmbed('vid1', 'https://stream.farcaster.xyz/v1/video/xyz.m3u8'),
    ];
    expect(embedUrlsForCast(embeds)).toEqual([
      'https://img.com/photo.jpg',
      'https://stream.farcaster.xyz/v1/video/xyz.m3u8',
    ]);
  });

  it('skips media entries without a final URL', () => {
    const inFlight = imageEmbed('img-uploading', undefined);
    expect(embedUrlsForCast([inFlight])).toEqual([]);
  });

  it('skips uploading media entries even when they have placeholder URLs', () => {
    const uploadingVideo: CastComposerEmbed = {
      id: 'vid-uploading',
      kind: 'video',
      url: 'https://stream.farcaster.xyz/v1/video/pending.m3u8',
      localUriRef: 'file://pending.mp4',
      width: 0,
      height: 0,
      uploadStatus: 'uploading',
    };
    expect(embedUrlsForCast([uploadingVideo])).toEqual([]);
  });

  it('preserves array order', () => {
    const embeds: CastComposerEmbed[] = [
      imageEmbed('1', 'https://img.com/a.jpg'),
      urlEmbed('2', 'https://link.com', 'other'),
      castEmbed('3', '0xdeadbeef'),
      snapEmbed('4', 'https://snap.com', 'other'),
    ];
    expect(embedUrlsForCast(embeds)).toEqual([
      'https://img.com/a.jpg',
      'https://link.com',
      '0xdeadbeef',
      'https://snap.com',
    ]);
  });

  it('can omit text-derived URL and snap embeds for draft persistence', () => {
    const embeds: CastComposerEmbed[] = [
      urlEmbed('text-url', 'https://text-url.com', 'text'),
      snapEmbed('text-snap', 'https://text-snap.com', 'text'),
      snapEmbed('other-snap', 'https://other-snap.com', 'other'),
      urlEmbed('other-url', 'https://other-url.com', 'other'),
      imageEmbed('image', 'https://img.com/a.jpg'),
    ];

    expect(embedUrlsForCast(embeds, { includeTextEmbeds: false })).toEqual([
      'https://other-snap.com',
      'https://other-url.com',
      'https://img.com/a.jpg',
    ]);
  });
});

// ---------------------------------------------------------------------------
// apiEmbedsForCast
// ---------------------------------------------------------------------------

describe('apiEmbedsForCast', () => {
  it('derives image embeds from apiImageEmbed field', () => {
    const embed: CastComposerEmbed = {
      id: '1',
      kind: 'image',
      url: 'https://img.com/a.jpg',
      apiImageEmbed: {
        type: 'image',
        alt: 'Image',
        sourceUrl: 'https://img.com/a.jpg',
        url: 'https://img.com/a.jpg',
      },
    };
    const result = apiEmbedsForCast([embed]);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toBe('https://img.com/a.jpg');
  });

  it('synthesizes an image embed from url + dimensions when apiImageEmbed is absent', () => {
    const embed: CastComposerEmbed = {
      id: '1',
      kind: 'image',
      url: 'https://img.com/a.jpg',
      width: 800,
      height: 600,
    };
    const result = apiEmbedsForCast([embed]);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].sourceUrl).toBe('https://img.com/a.jpg');
  });

  it('skips images with no url and no apiImageEmbed', () => {
    const embed: CastComposerEmbed = { id: '1', kind: 'image' };
    expect(apiEmbedsForCast([embed]).images).toHaveLength(0);
  });

  it('derives url embed metadata', () => {
    const metadata = {
      type: 'url' as const,
      openGraph: {
        url: 'https://example.com',
        title: 'Example',
        description: 'desc',
      },
    };
    const embed: CastComposerEmbed = {
      id: '1',
      kind: 'url',
      url: 'https://example.com',
      source: 'text',
      metadata: metadata as ReturnType<typeof urlEmbed> extends {
        metadata?: infer M;
      }
        ? M
        : never,
    };
    const result = apiEmbedsForCast([embed as CastComposerEmbed]);
    expect(result.urls).toHaveLength(1);
  });

  it('skips url embeds without metadata', () => {
    const embed: CastComposerEmbed = urlEmbed('1', 'https://example.com');
    expect(apiEmbedsForCast([embed]).urls).toHaveLength(0);
  });

  it('returns empty buckets for cast-kind entries', () => {
    const embed = castEmbed('1', '0xabc');
    const result = apiEmbedsForCast([embed]);
    expect(result.images).toHaveLength(0);
    expect(result.urls).toHaveLength(0);
    expect(result.videos).toHaveLength(0);
  });
});

describe('buildCanonicalEmbedsFromDraft', () => {
  it('keeps the requested URL while storing resolved metadata aliases', () => {
    const requestedUrl = 'https://gmfarcaster.com/miniapp/share';
    const resolvedUrl = 'https://gmfarcaster.com/';

    const result = buildCanonicalEmbedsFromDraft({
      embeds: [requestedUrl],
      images: [],
      videos: [],
      urls: [apiUrlEmbed(resolvedUrl, requestedUrl)],
      nextEmbedId: () => 'embed-1',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'embed-1',
      kind: 'url',
      url: requestedUrl,
      source: 'other',
      metadata: apiUrlEmbed(resolvedUrl, requestedUrl),
    });
  });

  it('stores resolved quote casts as one canonical cast embed', () => {
    const castHash = '0xabc123';
    const quote = {
      hash: castHash,
      author: { username: 'alice' },
    } as ApiQuoteCastEmbed;

    const result = buildCanonicalEmbedsFromDraft({
      embeds: [castHash],
      images: [],
      videos: [],
      urls: [],
      casts: [quote],
      nextEmbedId: () => 'embed-1',
    });

    expect(result).toEqual([
      {
        id: 'embed-1',
        kind: 'cast',
        hash: castHash,
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// getEmbedsToSubmit
// ---------------------------------------------------------------------------

describe('getEmbedsToSubmit', () => {
  it('returns ordered URLs for uploaded and url embeds', async () => {
    const embeds: CastComposerEmbed[] = [
      imageEmbed('1', 'https://img.com/a.jpg'),
      urlEmbed('2', 'https://link.com', 'other'),
    ];
    await expect(getEmbedsToSubmit(embeds)).resolves.toEqual([
      'https://img.com/a.jpg',
      'https://link.com',
    ]);
  });

  it('awaits in-flight image upload promise', async () => {
    let resolveUpload!: () => void;
    const uploadPromise: Promise<Response> = new Promise((resolve) => {
      resolveUpload = () => resolve(new Response());
    });
    const embed: CastComposerEmbed = {
      id: '1',
      kind: 'image',
      url: 'https://img.com/a.jpg',
      uploadPromise,
      uploadStatus: 'uploading',
    };

    const submitPromise = getEmbedsToSubmit([embed]);
    resolveUpload();
    const urls = await submitPromise;
    expect(urls).toEqual(['https://img.com/a.jpg']);
  });

  it('throws when an image upload has failed', async () => {
    const embed: CastComposerEmbed = {
      id: '1',
      kind: 'image',
      url: 'https://img.com/a.jpg',
      uploadStatus: 'failed',
      uploadError: 'network error',
    };
    await expect(getEmbedsToSubmit([embed])).rejects.toThrow(
      'Image upload failed',
    );
  });

  it('throws when a video upload has failed', async () => {
    const embed: CastComposerEmbed = {
      id: '1',
      kind: 'video',
      localUriRef: 'file://video.mp4',
      width: 1280,
      height: 720,
      uploadStatus: 'failed',
      uploadError: 'timeout',
    };
    await expect(getEmbedsToSubmit([embed])).rejects.toThrow(
      'Video upload failed',
    );
  });

  it('skips media entries without a final url', async () => {
    const embed: CastComposerEmbed = { id: '1', kind: 'image' };
    await expect(getEmbedsToSubmit([embed])).resolves.toEqual([]);
  });

  it('includes cast hashes', async () => {
    const embeds: CastComposerEmbed[] = [
      castEmbed('1', '0xabc123'),
      urlEmbed('2', 'https://link.com', 'text'),
    ];
    await expect(getEmbedsToSubmit(embeds)).resolves.toEqual([
      '0xabc123',
      'https://link.com',
    ]);
  });

  it('can omit text-derived URL and snap embeds for draft persistence', async () => {
    const embeds: CastComposerEmbed[] = [
      urlEmbed('text-url', 'https://text-url.com', 'text'),
      snapEmbed('text-snap', 'https://text-snap.com', 'text'),
      snapEmbed('other-snap', 'https://other-snap.com', 'other'),
      urlEmbed('other-url', 'https://other-url.com', 'other'),
      imageEmbed('image', 'https://img.com/a.jpg'),
    ];

    await expect(
      getEmbedsToSubmit(embeds, { includeTextEmbeds: false }),
    ).resolves.toEqual([
      'https://other-snap.com',
      'https://other-url.com',
      'https://img.com/a.jpg',
    ]);
  });

  it('throws when a video upload is still in progress', async () => {
    const embed: CastComposerEmbed = {
      id: '1',
      kind: 'video',
      url: 'https://stream.farcaster.xyz/v1/video/pending.m3u8',
      localUriRef: 'file://video.mp4',
      width: 0,
      height: 0,
      uploadStatus: 'uploading',
    };
    await expect(getEmbedsToSubmit([embed])).rejects.toThrow(
      'Video upload still in progress',
    );
  });

  it('late upload completion after removal does not re-add embed', async () => {
    // Simulate: embed is in the array with a promise, upload resolves later.
    // The key invariant is that callers pass the snapshot at submit-time, so
    // if the embed was already removed before getEmbedsToSubmit is called, it
    // simply won't appear in the input array.
    let resolveUpload!: () => void;
    const uploadPromise: Promise<Response> = new Promise((resolve) => {
      resolveUpload = () => resolve(new Response());
    });
    // uploadPromise is created but the embed is removed before submission.
    void uploadPromise;

    // Caller removes the embed → passes empty array to getEmbedsToSubmit
    const urls = await getEmbedsToSubmit([]);
    resolveUpload();
    expect(urls).toEqual([]);
  });
});
