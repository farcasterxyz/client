import { ApiCastEmbeds, ApiQuoteCastEmbed } from 'farcaster-client-data';

import {
  buildQuoteCastUrlSet,
  isQuoteCastUrl,
  stripQuoteCastUrlEmbeds,
} from '../quoteCastUrls';

const quote = {
  hash: '0x77f24c47ad9f0f1ce85ea6ecadf035f85d8b8ccc',
  author: { username: 'limone.eth' },
} as ApiQuoteCastEmbed;

describe('quoteCastUrls', () => {
  it('matches canonical farcaster cast URLs', () => {
    const quoteCastUrls = buildQuoteCastUrlSet({ quotes: [quote] });

    expect(
      isQuoteCastUrl({
        url: 'https://farcaster.xyz/limone.eth/0x77f24c47',
        quoteCastUrls,
      }),
    ).toBe(true);
  });

  it('matches canonicalized conversation URLs for quoted casts', () => {
    const quoteCastUrls = buildQuoteCastUrlSet({ quotes: [quote] });

    expect(
      isQuoteCastUrl({
        url: `https://farcaster.xyz/~/conversations/${quote.hash}`,
        quoteCastUrls,
      }),
    ).toBe(true);
  });

  it('matches sourceUrl when openGraph.url has been rewritten', () => {
    const quoteCastUrls = buildQuoteCastUrlSet({ quotes: [quote] });

    expect(
      isQuoteCastUrl({
        url: `https://farcaster.xyz/~/conversations/${quote.hash}`,
        sourceUrl: 'https://farcaster.xyz/limone.eth/0x77f24c47',
        quoteCastUrls,
      }),
    ).toBe(true);
  });

  it('buildQuoteCastUrlSet supports hash-only quotes without author', () => {
    const quoteCastUrls = buildQuoteCastUrlSet({
      quotes: [{ hash: '0xabc' } as ApiQuoteCastEmbed],
    });

    expect(
      isQuoteCastUrl({
        url: 'https://farcaster.xyz/~/conversations/0xabc',
        quoteCastUrls,
      }),
    ).toBe(true);
    expect(
      isQuoteCastUrl({
        url: 'https://farcaster.xyz/someuser/0xabc',
        quoteCastUrls,
      }),
    ).toBe(false);
  });

  it('stripQuoteCastUrlEmbeds removes conversation URL previews when quote exists', () => {
    const embeds = {
      casts: [quote],
      images: [],
      urls: [
        {
          type: 'url',
          openGraph: {
            url: `https://farcaster.xyz/~/conversations/${quote.hash}`,
            title: 'cast page',
          },
        },
      ],
      unknowns: [],
    } satisfies ApiCastEmbeds;

    expect(stripQuoteCastUrlEmbeds(embeds).urls).toEqual([]);
  });

  it('stripQuoteCastUrlEmbeds removes localhost previews for the same quote', () => {
    const embeds = {
      casts: [quote],
      images: [],
      urls: [
        {
          type: 'url',
          openGraph: {
            url: 'http://localhost:5173/limone.eth/0x77f24c47',
            title: 'Farcaster',
          },
        },
      ],
      unknowns: [],
    } satisfies ApiCastEmbeds;

    expect(
      stripQuoteCastUrlEmbeds(embeds, {
        requestedUrls: ['http://localhost:5173/limone.eth/0x77f24c47'],
      }).urls,
    ).toEqual([]);
  });
});
