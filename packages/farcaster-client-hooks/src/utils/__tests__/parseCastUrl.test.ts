import { describe, expect, it } from 'vitest';

import {
  isCastEmbedReference,
  isFullCastHash,
  parseCastUrl,
} from '../parseCastUrl';

const FULL_HASH = '0x615390402f842da885afa55601712c2d9ae21a1a';
const SHORT_HASH = '0x61539040';

describe('parseCastUrl', () => {
  it('parses username + short hash (farcaster.xyz)', () => {
    expect(parseCastUrl(`https://farcaster.xyz/bradq/${SHORT_HASH}`)).toEqual({
      kind: 'username-and-hash',
      username: 'bradq',
      hashSegment: SHORT_HASH,
    });
  });

  it('parses username + short hash (warpcast.com)', () => {
    expect(parseCastUrl(`https://warpcast.com/bradq/${SHORT_HASH}`)).toEqual({
      kind: 'username-and-hash',
      username: 'bradq',
      hashSegment: SHORT_HASH,
    });
  });

  it('parses dotted username + short hash (farcaster.xyz)', () => {
    expect(
      parseCastUrl(`https://farcaster.xyz/limone.eth/${SHORT_HASH}`),
    ).toEqual({
      kind: 'username-and-hash',
      username: 'limone.eth',
      hashSegment: SHORT_HASH,
    });
  });

  it('parses username + full 40-char hash as username-and-hash', () => {
    expect(parseCastUrl(`https://farcaster.xyz/bradq/${FULL_HASH}`)).toEqual({
      kind: 'username-and-hash',
      username: 'bradq',
      hashSegment: FULL_HASH,
    });
  });

  it('parses conversations URL with full 40-char hash', () => {
    expect(
      parseCastUrl(`https://farcaster.xyz/~/conversations/${FULL_HASH}`),
    ).toEqual({
      kind: 'conversation-hash',
      hashSegment: FULL_HASH,
    });
  });

  it('parses conversations URL with short hash', () => {
    expect(
      parseCastUrl(`https://farcaster.xyz/~/conversations/${SHORT_HASH}`),
    ).toEqual({
      kind: 'conversation-hash',
      hashSegment: SHORT_HASH,
    });
  });

  it('classifies real Farcaster full hashes correctly', () => {
    expect(isFullCastHash(FULL_HASH)).toBe(true);
    expect(isFullCastHash(SHORT_HASH)).toBe(false);
  });

  it('classifies cast embed references', () => {
    expect(isCastEmbedReference(FULL_HASH)).toBe(true);
    expect(isCastEmbedReference(SHORT_HASH)).toBe(true);
    expect(
      isCastEmbedReference(`https://farcaster.xyz/bradq/${SHORT_HASH}`),
    ).toBe(true);
    expect(isCastEmbedReference('https://example.com/not-a-cast')).toBe(false);
  });

  it('normalizes mixed-case hashes to lowercase', () => {
    expect(
      parseCastUrl('https://farcaster.xyz/bradq/0x61539040ABCDEF01'),
    ).toEqual({
      kind: 'username-and-hash',
      username: 'bradq',
      hashSegment: '0x61539040abcdef01',
    });
  });

  it('returns not-cast-url for unrelated paths', () => {
    expect(parseCastUrl('https://farcaster.xyz/~/settings')).toEqual({
      kind: 'not-cast-url',
    });
  });

  it('returns not-cast-url for token /~/ca/ URLs', () => {
    expect(
      parseCastUrl(
        'https://farcaster.xyz/~/ca/0x1234567890abcdef1234567890abcdef12345678',
      ),
    ).toEqual({ kind: 'not-cast-url' });
  });

  it('returns not-cast-url for non-Farcaster hosts', () => {
    expect(parseCastUrl(`https://example.com/bradq/${SHORT_HASH}`)).toEqual({
      kind: 'not-cast-url',
    });
  });

  it('parses username + short hash on localhost (web dev)', () => {
    expect(parseCastUrl(`http://localhost:5173/trupty/${SHORT_HASH}`)).toEqual({
      kind: 'username-and-hash',
      username: 'trupty',
      hashSegment: SHORT_HASH,
    });
  });

  it('returns not-cast-url for invalid URLs', () => {
    expect(parseCastUrl('not a url')).toEqual({ kind: 'not-cast-url' });
    expect(parseCastUrl('')).toEqual({ kind: 'not-cast-url' });
  });

  it('returns not-cast-url for hash too short to be a prefix (<8 hex)', () => {
    expect(parseCastUrl('https://farcaster.xyz/bradq/0x6153')).toEqual({
      kind: 'not-cast-url',
    });
  });
});
