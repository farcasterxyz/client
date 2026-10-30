import { describe, expect, it } from 'vitest';

import { isFarcasterAppUrl, replaceNewlinesWithSpaces } from '../UrlUtils';

describe('replaceNewlinesWithSpaces', () => {
  it('replaces every newline, not just the first', () => {
    expect(replaceNewlinesWithSpaces('a\nb\nc\nd')).toBe('a b c d');
  });

  it('leaves text without newlines unchanged', () => {
    expect(replaceNewlinesWithSpaces('no breaks here')).toBe('no breaks here');
  });
});

describe('isFarcasterAppUrl', () => {
  it.each([
    'https://warpcast.com',
    'https://warpcast.com/dwr/0x1234',
    'https://farcaster.xyz/~/settings',
    'farcaster://casts/0x1234',
  ])('accepts %s', (url) => {
    expect(isFarcasterAppUrl(url)).toBe(true);
  });

  it.each([
    'https://warpcast.com.evil.example/path',
    'https://farcaster.xyz.evil.example',
    'https://evil.example/?next=https://farcaster.xyz/',
    'https://user@evil.example/https://warpcast.com',
    'http://warpcast.com',
    'https://notwarpcast.com',
    'not a url',
    '',
  ])('rejects %s', (url) => {
    expect(isFarcasterAppUrl(url)).toBe(false);
  });
});
