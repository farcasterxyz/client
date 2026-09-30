import { ApiCast } from 'farcaster-client-data';

import {
  castHasPendingTranslation,
  castHasTranslation,
  getCastDisplayText,
  getCastTranslationSourceLanguageName,
} from '~/utils/castTranslationUtils';

const baseCast: ApiCast = {
  hash: '0x1' as ApiCast['hash'],
  threadHash: '0x1' as ApiCast['threadHash'],
  author: {
    fid: 1,
    displayName: 'Test User',
    profile: {
      bio: {
        text: '',
        mentions: [],
      },
    },
    followerCount: 0,
    followingCount: 0,
  },
  text: '',
  timestamp: 0,
  replies: {
    count: 0,
  },
  reactions: {
    count: 0,
  },
  recasts: {
    count: 0,
  },
  watches: {
    count: 0,
  },
};

const cast: ApiCast = {
  ...baseCast,
  text: 'Bonjour le monde',
  translation: {
    status: 'READY',
    sourceLanguageIsoCode: 'fr',
    targetLanguageIsoCode: 'en',
    text: 'Hello world',
  },
};

describe('castTranslationUtils', () => {
  it('prefers translation text by default', () => {
    expect(
      getCastDisplayText({
        cast,
        showOriginal: false,
      }),
    ).toBe('Hello world');
  });

  it('returns original text when toggled', () => {
    expect(
      getCastDisplayText({
        cast,
        showOriginal: true,
      }),
    ).toBe('Bonjour le monde');
  });

  it('detects translated casts', () => {
    expect(castHasTranslation(cast)).toBe(true);
    expect(castHasPendingTranslation(cast)).toBe(false);
    expect(castHasTranslation({ text: 'plain cast' } as ApiCast)).toBe(false);
    expect(
      castHasTranslation({
        ...baseCast,
        text: 'Bonjour le monde',
        translation: {
          status: 'PENDING',
          sourceLanguageIsoCode: 'fr',
          targetLanguageIsoCode: 'en',
        },
      }),
    ).toBe(false);
    expect(
      castHasPendingTranslation({
        ...baseCast,
        text: 'Bonjour le monde',
        translation: {
          status: 'PENDING',
          sourceLanguageIsoCode: 'fr',
          targetLanguageIsoCode: 'en',
        },
      }),
    ).toBe(true);
  });

  it('formats source language names', () => {
    // Intl.DisplayNames output varies by ICU data in the runtime.
    expect(getCastTranslationSourceLanguageName(cast)).toMatch(/French|^fr$/i);
  });
});
