import type { ApiCastUrlEmbed } from 'farcaster-client-data';

import {
  findMissingOrIncompleteRequestedUrls,
  projectUrlEmbedsForRequestedUrls,
} from '../castComposerMetadataEnrichment';

const apiUrlEmbed = ({
  url,
  sourceUrl,
  title,
  description,
}: {
  url: string;
  sourceUrl?: string;
  title?: string;
  description?: string;
}): ApiCastUrlEmbed =>
  ({
    type: 'url',
    openGraph: {
      url,
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    },
  }) as ApiCastUrlEmbed;

describe('castComposerMetadataEnrichment', () => {
  it('treats URL embeds without title and description as incomplete', () => {
    expect(
      findMissingOrIncompleteRequestedUrls({
        requestedUrls: ['https://x.com/grin_io'],
        urlEmbeds: [
          apiUrlEmbed({
            url: 'https://x.co',
            sourceUrl: 'https://x.com/grin_io',
          }),
        ],
      }),
    ).toEqual(['https://x.com/grin_io']);
  });

  it('uses fallback metadata when the crawl match is incomplete', () => {
    const projected = projectUrlEmbedsForRequestedUrls({
      requestedUrls: ['https://x.com/grin_io'],
      crawledUrlEmbeds: [
        apiUrlEmbed({
          url: 'https://x.co',
          sourceUrl: 'https://x.com/grin_io',
        }),
      ],
      fallbackUrlEmbeds: [
        apiUrlEmbed({
          url: 'https://x.com/grin_io',
          title: 'grin (@grin_io) on X',
          description: '@farcaster_xyz | cultivating shared resonance',
        }),
      ],
    });

    expect(projected.map((embed) => embed.openGraph.url)).toEqual([
      'https://x.com/grin_io',
    ]);
  });

  it('keeps complete crawl metadata ahead of fallback metadata', () => {
    const projected = projectUrlEmbedsForRequestedUrls({
      requestedUrls: ['https://example.com'],
      crawledUrlEmbeds: [
        apiUrlEmbed({
          url: 'https://example.com',
          title: 'Crawled',
          description: 'Real crawler result',
        }),
      ],
      fallbackUrlEmbeds: [
        apiUrlEmbed({
          url: 'https://example.com',
          title: 'Fallback',
          description: 'Fallback result',
        }),
      ],
    });

    expect(projected.map((embed) => embed.openGraph.title)).toEqual([
      'Crawled',
    ]);
  });
});
