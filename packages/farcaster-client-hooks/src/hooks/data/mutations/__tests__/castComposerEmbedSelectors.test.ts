import type { CastComposerEmbed } from '../castComposerEmbedHelpers';
import {
  buildCastComposerBucketView,
  buildEmbedUrlsByCast,
} from '../castComposerEmbedSelectors';

const urlEmbed = (
  id: string,
  url: string,
  source: 'text' | 'other' = 'text',
): CastComposerEmbed => ({
  id,
  kind: 'url',
  url,
  source,
});

const snapEmbed = (
  id: string,
  url: string,
  source: 'text' | 'other' = 'other',
): CastComposerEmbed => ({
  id,
  kind: 'snap',
  url,
  source,
});

const castEmbed = (id: string, hash: string): CastComposerEmbed => ({
  id,
  kind: 'cast',
  hash,
});

describe('buildEmbedUrlsByCast', () => {
  it('seeds empty URL arrays for known cast local keys without canonical embeds', () => {
    const result = buildEmbedUrlsByCast({
      canonicalEmbeds: {},
      castLocalKeys: [1, 2],
    });

    expect(result).toEqual({
      1: [],
      2: [],
    });
  });

  it('includes casts that only have extra URLs', () => {
    const result = buildEmbedUrlsByCast({
      canonicalEmbeds: {},
      extraUrlsByCast: {
        1: ['0xabc'],
      },
    });

    expect(result[1]).toEqual(['0xabc']);
  });

  it('dedupes URLs that differ only by trailing slash and keeps the first-seen raw value', () => {
    const canonicalEmbeds = {
      1: [
        urlEmbed('1', 'https://grin.io/chat'),
        urlEmbed('2', 'https://grin.io/chat/'),
      ],
    };

    const result = buildEmbedUrlsByCast({ canonicalEmbeds });

    expect(result[1]).toEqual(['https://grin.io/chat']);
  });

  it('dedupes between canonical URLs and extraUrlsByCast by normalized key', () => {
    const canonicalEmbeds = {
      1: [urlEmbed('1', 'https://grin.io/chat')],
    };
    const extraUrlsByCast = {
      1: ['https://grin.io/chat/'],
    };

    const result = buildEmbedUrlsByCast({
      canonicalEmbeds,
      extraUrlsByCast,
    });

    expect(result[1]).toEqual(['https://grin.io/chat']);
  });

  it('dedupes url and snap entries that share the same normalized URL', () => {
    const canonicalEmbeds = {
      1: [
        snapEmbed('1', 'https://grin.io/chat/'),
        urlEmbed('2', 'https://grin.io/chat'),
      ],
    };

    const result = buildEmbedUrlsByCast({ canonicalEmbeds });

    expect(result[1]).toEqual(['https://grin.io/chat/']);
  });

  it('treats cast hashes as opaque dedupe keys (no URL normalization)', () => {
    const canonicalEmbeds = {
      1: [castEmbed('1', '0xabc'), castEmbed('2', '0xabc')],
    };

    const result = buildEmbedUrlsByCast({ canonicalEmbeds });

    expect(result[1]).toEqual(['0xabc']);
  });

  it('omits text-derived url and snap embeds when includeTextEmbeds is false', () => {
    const canonicalEmbeds = {
      1: [
        urlEmbed('1', 'https://grin.io/chat', 'text'),
        urlEmbed('2', 'https://b.com', 'other'),
      ],
    };

    const result = buildEmbedUrlsByCast({
      canonicalEmbeds,
      includeTextEmbeds: false,
    });

    expect(result[1]).toEqual(['https://b.com']);
  });
});

describe('buildCastComposerBucketView', () => {
  it('seeds empty buckets for known cast local keys without canonical embeds', () => {
    const result = buildCastComposerBucketView({}, [1]);

    expect(result[1]).toEqual({
      images: [],
      videos: [],
      urls: [],
    });
  });
});
