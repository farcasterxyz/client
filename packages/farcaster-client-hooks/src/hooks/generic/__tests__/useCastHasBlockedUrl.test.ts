import { ApiCast } from 'farcaster-client-data';
import { describe, expect, it } from 'vitest';

import {
  castHasBlockedUrl,
  extractDomain,
  isDomainBlocked,
  normalizeSnapUrlForBlocklist,
} from '../useCastHasBlockedUrl';

// Minimal cast factories — the matcher only reads embeds, so we keep fixtures
// narrow and cast through unknown to avoid wiring up unrelated fields.
const castWithUrlEmbed = (openGraph: {
  url: string;
  sourceUrl?: string;
  snap?: { url: string };
  frameEmbedNext?: { frameUrl?: string };
  frame?: { frameUrl?: string };
}): ApiCast =>
  ({
    embeds: {
      urls: [{ type: 'url', openGraph }],
    },
  }) as unknown as ApiCast;

const castQuoting = (quoted: ApiCast): ApiCast =>
  ({
    embeds: {
      casts: [quoted],
    },
  }) as unknown as ApiCast;

const castWithHoistedSnap = (url: string): ApiCast =>
  ({
    embeds: {
      snap: [
        {
          type: 'snap',
          url,
          sourceUrl: url,
        },
      ],
    },
  }) as unknown as ApiCast;

describe('extractDomain', () => {
  it('lowercases the hostname', () => {
    expect(extractDomain('https://Evil.COM/path')).toBe('evil.com');
  });

  it('strips a trailing dot (fully-qualified DNS form)', () => {
    expect(extractDomain('https://evil.com./path')).toBe('evil.com');
    expect(extractDomain('https://EVIL.com./')).toBe('evil.com');
  });

  it('returns undefined for non-URL strings', () => {
    expect(extractDomain('not a url')).toBeUndefined();
  });
});

describe('isDomainBlocked', () => {
  it('returns false against an empty blocklist', () => {
    expect(isDomainBlocked('evil.com', new Set())).toBe(false);
  });

  it('matches exact hostname', () => {
    expect(isDomainBlocked('evil.com', new Set(['evil.com']))).toBe(true);
  });

  it('matches subdomains (single level)', () => {
    expect(isDomainBlocked('phish.evil.com', new Set(['evil.com']))).toBe(true);
  });

  it('matches deeply nested subdomains', () => {
    expect(isDomainBlocked('a.b.c.phish.evil.com', new Set(['evil.com']))).toBe(
      true,
    );
  });

  it('does NOT match the parent of a blocked subdomain', () => {
    expect(isDomainBlocked('evil.com', new Set(['phish.evil.com']))).toBe(
      false,
    );
  });

  it('does NOT match a sibling subdomain', () => {
    expect(isDomainBlocked('other.evil.com', new Set(['phish.evil.com']))).toBe(
      false,
    );
  });

  it('does NOT match a substring without a dot boundary', () => {
    // aaaphish.evil.com is not a subdomain of phish.evil.com.
    expect(
      isDomainBlocked('aaaphish.evil.com', new Set(['phish.evil.com'])),
    ).toBe(false);
  });

  it('matches when domain is exactly on a public-suffix-style entry', () => {
    // We don't add eTLD+1 logic; an explicit entry like `phishing.vercel.app`
    // matches itself and its subdomains, not other `*.vercel.app` apps.
    expect(
      isDomainBlocked('phishing.vercel.app', new Set(['phishing.vercel.app'])),
    ).toBe(true);
    expect(
      isDomainBlocked(
        'again.phishing.vercel.app',
        new Set(['phishing.vercel.app']),
      ),
    ).toBe(true);
    expect(
      isDomainBlocked('vercel.app', new Set(['phishing.vercel.app'])),
    ).toBe(false);
    expect(
      isDomainBlocked('other.vercel.app', new Set(['phishing.vercel.app'])),
    ).toBe(false);
  });
});

describe('normalizeSnapUrlForBlocklist', () => {
  it('strips query params and hash', () => {
    expect(
      normalizeSnapUrlForBlocklist('https://example.com/snap.json?utm=1#state'),
    ).toBe('https://example.com/snap.json');
  });

  it('lowercases hostnames', () => {
    expect(normalizeSnapUrlForBlocklist('https://EXAMPLE.COM/snap.json')).toBe(
      'https://example.com/snap.json',
    );
  });

  it('strips trailing slashes from paths', () => {
    expect(
      normalizeSnapUrlForBlocklist('https://example.com/snaps/blocked/'),
    ).toBe('https://example.com/snaps/blocked');
  });

  it('normalizes safe percent encodings in paths', () => {
    expect(
      normalizeSnapUrlForBlocklist(
        'https://example.com/snaps/%7Eblocked%2ejson',
      ),
    ).toBe('https://example.com/snaps/~blocked.json');
  });

  it('preserves reserved percent encodings in paths', () => {
    expect(
      normalizeSnapUrlForBlocklist('https://example.com/snaps/a%2fb.json'),
    ).toBe('https://example.com/snaps/a%2Fb.json');
  });

  it('keeps different paths distinct', () => {
    expect(normalizeSnapUrlForBlocklist('https://example.com/a.json')).not.toBe(
      normalizeSnapUrlForBlocklist('https://example.com/b.json'),
    );
  });

  it('returns undefined for invalid URLs', () => {
    expect(normalizeSnapUrlForBlocklist('not a url')).toBeUndefined();
  });
});

describe('castHasBlockedUrl', () => {
  const blocked = new Set(['evil.com']);
  const blockedSnaps = new Set(['https://example.com/blocked-snap.json']);

  it('returns false when blocklist is empty (short-circuit, even with matching embeds)', () => {
    const cast = castWithUrlEmbed({ url: 'https://evil.com/scam' });
    expect(castHasBlockedUrl(cast, new Set())).toBe(false);
  });

  it('returns false for a cast with no embeds', () => {
    const cast = { embeds: undefined } as unknown as ApiCast;
    expect(castHasBlockedUrl(cast, blocked)).toBe(false);
  });

  it('blocks when og.url matches', () => {
    const cast = castWithUrlEmbed({ url: 'https://evil.com/scam' });
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });

  it('blocks when og.sourceUrl matches even if og.url does not', () => {
    const cast = castWithUrlEmbed({
      url: 'https://safe.example/redirected',
      sourceUrl: 'https://evil.com/scam',
    });
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });

  it('blocks when frameEmbedNext.frameUrl is on a blocked domain', () => {
    const cast = castWithUrlEmbed({
      url: 'https://safe.example',
      frameEmbedNext: { frameUrl: 'https://evil.com/frame' },
    });
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });

  it('blocks when openGraph.snap.url is on the exact Snap URL blocklist', () => {
    const cast = castWithUrlEmbed({
      url: 'https://safe.example',
      snap: { url: 'https://example.com/blocked-snap.json?utm=1#state' },
    });
    expect(castHasBlockedUrl(cast, new Set(), blockedSnaps)).toBe(true);
  });

  it('blocks when a hoisted snap embed URL is on the exact Snap URL blocklist', () => {
    const cast = castWithHoistedSnap(
      'https://example.com/blocked-snap.json?utm=1',
    );
    expect(castHasBlockedUrl(cast, new Set(), blockedSnaps)).toBe(true);
  });

  it('blocks when a quoted cast has a hoisted snap embed URL on the exact blocklist', () => {
    const cast = castQuoting(
      castWithHoistedSnap('https://example.com/blocked-snap.json'),
    );
    expect(castHasBlockedUrl(cast, new Set(), blockedSnaps)).toBe(true);
  });

  it('does not block a Snap URL just because it shares a domain with a blocked Snap', () => {
    const cast = castWithHoistedSnap('https://example.com/other-snap.json');
    expect(castHasBlockedUrl(cast, new Set(), blockedSnaps)).toBe(false);
  });

  it('does not check Snap URLs against the normal domain blocklist', () => {
    const cast = castWithHoistedSnap('https://evil.com/snap.json');
    expect(castHasBlockedUrl(cast, blocked, new Set())).toBe(false);
  });

  it('blocks when legacy frame.frameUrl is on a blocked domain', () => {
    const cast = castWithUrlEmbed({
      url: 'https://safe.example',
      frame: { frameUrl: 'https://evil.com/legacy' },
    });
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });

  it('blocks when a launch_frame action URL is on a blocked domain', () => {
    const cast = {
      embeds: {
        urls: [
          {
            type: 'url',
            openGraph: {
              url: 'https://safe.example',
              frameEmbedNext: {
                frameUrl: 'https://safe.example/frame',
                frameEmbed: {
                  button: {
                    title: 'Launch',
                    action: {
                      type: 'launch_frame',
                      name: 'Evil App',
                      url: 'https://evil.com/launch',
                    },
                  },
                },
              },
            },
          },
        ],
      },
    } as unknown as ApiCast;
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });

  it('does not block a view_token action (action has no URL to check)', () => {
    const cast = {
      embeds: {
        urls: [
          {
            type: 'url',
            openGraph: {
              url: 'https://safe.example',
              frameEmbedNext: {
                frameUrl: 'https://safe.example/frame',
                frameEmbed: {
                  button: {
                    title: 'View Token',
                    action: { type: 'view_token', token: '0xdeadbeef' },
                  },
                },
              },
            },
          },
        ],
      },
    } as unknown as ApiCast;
    expect(castHasBlockedUrl(cast, blocked)).toBe(false);
  });

  it('blocks subdomains of blocked entries', () => {
    const cast = castWithUrlEmbed({
      url: 'https://phish.evil.com/scam',
    });
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });

  it('does not block lookalike domains that contain the blocked string as a substring', () => {
    // `other-evil.com` shares the substring `evil.com` but is a different
    // registrable domain — the dot boundary in isDomainBlocked rejects it.
    const cast = castWithUrlEmbed({
      url: 'https://other-evil.com/scam',
    });
    expect(castHasBlockedUrl(cast, blocked)).toBe(false);
  });

  it('does not block when no embed URL matches', () => {
    const cast = castWithUrlEmbed({ url: 'https://safe.example' });
    expect(castHasBlockedUrl(cast, blocked)).toBe(false);
  });

  it('propagates through quote-cast embeds', () => {
    const quoted = castWithUrlEmbed({ url: 'https://evil.com/inner' });
    const cast = castQuoting(quoted);
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });

  it('returns true if any of several URL embeds is blocked', () => {
    const cast = {
      embeds: {
        urls: [
          { type: 'url', openGraph: { url: 'https://safe.example' } },
          { type: 'url', openGraph: { url: 'https://evil.com/scam' } },
        ],
      },
    } as unknown as ApiCast;
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });

  it('handles a trailing-dot hostname bypass attempt', () => {
    const cast = castWithUrlEmbed({ url: 'https://evil.com./scam' });
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });

  it('is case-insensitive on the URL side (entries are lowercased on input)', () => {
    const cast = castWithUrlEmbed({ url: 'https://EVIL.COM/scam' });
    expect(castHasBlockedUrl(cast, blocked)).toBe(true);
  });
});
