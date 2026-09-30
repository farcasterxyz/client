import { describe, expect, it } from 'vitest';

import {
  getCastComposerEmbedsForLocalKey,
  getEmbedUrlsForLocalKey,
} from '~/components/composer/composerStateDefaults';

describe('composerStateDefaults', () => {
  it('returns a stable empty embeds object for casts without embed state', () => {
    const first = getCastComposerEmbedsForLocalKey({
      embeds: {},
      localKey: 1,
    });
    const second = getCastComposerEmbedsForLocalKey({
      embeds: {},
      localKey: 1,
    });

    expect(first).toBe(second);
    expect(first).toEqual({
      images: [],
      videos: [],
      urls: [],
    });
  });

  it('returns a stable empty URL list for casts without embed URL state', () => {
    const first = getEmbedUrlsForLocalKey({
      embedUrls: {},
      localKey: 1,
    });
    const second = getEmbedUrlsForLocalKey({
      embedUrls: {},
      localKey: 1,
    });

    expect(first).toBe(second);
    expect(first).toEqual([]);
  });

  it('returns populated state when it exists', () => {
    const embeds = {
      1: {
        images: [],
        videos: [],
        urls: [],
      },
    };
    const embedUrls = {
      1: ['https://example.com'],
    };

    expect(
      getCastComposerEmbedsForLocalKey({
        embeds,
        localKey: 1,
      }),
    ).toBe(embeds[1]);
    expect(
      getEmbedUrlsForLocalKey({
        embedUrls,
        localKey: 1,
      }),
    ).toBe(embedUrls[1]);
  });
});
