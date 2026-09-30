import type {
  ApiCastImageEmbed,
  ApiCastUrlEmbed,
  ApiCastVideoEmbed,
  ApiQuoteCastEmbed,
} from 'farcaster-client-data';

import { filterDraftUrlEmbeds } from '../castComposerDraftHydration';

const urlEmbed = (url: string): ApiCastUrlEmbed => ({
  type: 'url',
  openGraph: {
    url,
  },
});

describe('filterDraftUrlEmbeds', () => {
  it('removes URL previews that duplicate media source URLs', () => {
    const image: ApiCastImageEmbed = {
      type: 'image',
      url: 'https://imagedelivery.net/image/original',
      sourceUrl: 'https://example.com/image.png',
      alt: '',
    };
    const video: ApiCastVideoEmbed = {
      type: 'video',
      url: 'https://video.example.com/video.mp4',
      sourceUrl: 'https://example.com/video.mp4',
    };

    const result = filterDraftUrlEmbeds({
      images: [image],
      videos: [video],
      urls: [
        urlEmbed('https://example.com/image.png'),
        urlEmbed('https://example.com/video.mp4'),
        urlEmbed('https://example.com/article'),
      ],
    });

    expect(result.map((url) => url.openGraph.url)).toEqual([
      'https://example.com/article',
    ]);
  });

  it('removes URL previews that duplicate hydrated quote casts', () => {
    const quotedCast = {
      hash: '0xbad9426314ab47cda4e92ea4337ba7f78b7a2ed6',
      author: {
        username: 'mm-fc-420',
      },
    } as unknown as ApiQuoteCastEmbed;

    const result = filterDraftUrlEmbeds({
      images: [],
      videos: [],
      casts: [quotedCast],
      urls: [
        urlEmbed('https://farcaster.xyz/mm-fc-420/0xbad94263'),
        urlEmbed('https://warpcast.com/mm-fc-420/0xbad94263'),
        urlEmbed('https://example.com/article'),
      ],
    });

    expect(result.map((url) => url.openGraph.url)).toEqual([
      'https://example.com/article',
    ]);
  });
});
