import type { ApiCastEmbeds } from 'farcaster-client-data';

import { getCastEmbedLayout } from '../EmbedLayoutUtils';

const snapEmbeds = {
  images: [],
  urls: [
    {
      type: 'url',
      openGraph: {
        url: 'https://snap.example',
        sourceUrl: 'https://snap.example',
        domain: 'snap.example',
        snap: { url: 'https://snap.example' },
      },
    },
  ],
  unknowns: [],
} satisfies ApiCastEmbeds;

describe('getCastEmbedLayout', () => {
  it('does not cap web snap carousels vertically and keeps media tile sizing separate', () => {
    const layout = getCastEmbedLayout({
      embeds: snapEmbeds,
      platform: 'web',
      isFocused: false,
      renderingCarousel: true,
      carouselHasNonMedia: true,
      feedRenderingWidthOverride: 618,
    });

    expect(layout.mode).toBe('snap');
    expect(layout.height).toBe(320);
    expect(layout.carouselMaxHeight).toBeUndefined();
    expect(layout.mediaTileHeight).toBe(500);
  });

  it('keeps the snap carousel cap on mobile', () => {
    const layout = getCastEmbedLayout({
      embeds: snapEmbeds,
      platform: 'mobile',
      isFocused: false,
      renderingCarousel: true,
      carouselHasNonMedia: true,
      postWidth: 360,
    });

    expect(layout.mode).toBe('snap');
    expect(layout.height).toBe(238);
    expect(layout.carouselMaxHeight).toBe(500);
    expect(layout.mediaTileHeight).toBeUndefined();
  });
});
