import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getActiveDraftLocalDraftKey,
  getLocalDraft,
  LocalDraft,
  setLocalDraft,
} from '~/components/composer/LocalDrafts';

const SCOPED_STORAGE_KEY = 'local-caststorm-drafts-by-key';
const FIXED_NOW = 1_700_000_000_000;

function createLocalStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

const baseDraft: LocalDraft = {
  casts: [{ text: 'hello', embeds: ['https://example.com'] }],
  channelKey: undefined,
  parentCastHash: undefined,
  scheduledAt: undefined,
};

describe('LocalDrafts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.stubGlobal('window', {
      localStorage: createLocalStorage(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('keeps scoped drafts isolated by recovery key', () => {
    setLocalDraft(baseDraft, 'cast:new');
    setLocalDraft(
      {
        ...baseDraft,
        casts: [{ text: 'reply', embeds: [] }],
        parentCastHash: '0xabc',
      },
      'reply:0xabc',
    );
    setLocalDraft(
      {
        ...baseDraft,
        casts: [{ text: 'draft edit', embeds: [] }],
      },
      getActiveDraftLocalDraftKey('draft-1'),
    );

    expect(getLocalDraft('cast:new')).toEqual(
      expect.objectContaining({
        casts: [{ text: 'hello', embeds: ['https://example.com'] }],
      }),
    );
    expect(getLocalDraft('cast:new')?.parentCastHash).toBeUndefined();
    expect(getLocalDraft('reply:0xabc')).toEqual(
      expect.objectContaining({
        casts: [{ text: 'reply', embeds: [] }],
        parentCastHash: '0xabc',
      }),
    );
    expect(getLocalDraft(getActiveDraftLocalDraftKey('draft-1'))).toEqual(
      expect.objectContaining({
        casts: [{ text: 'draft edit', embeds: [] }],
      }),
    );

    setLocalDraft(undefined, 'reply:0xabc');

    expect(getLocalDraft('reply:0xabc')).toBeUndefined();
    expect(getLocalDraft(getActiveDraftLocalDraftKey('draft-1'))).toEqual(
      expect.objectContaining({
        casts: [{ text: 'draft edit', embeds: [] }],
      }),
    );
    expect(getLocalDraft('cast:new')).toEqual(
      expect.objectContaining({
        casts: [{ text: 'hello', embeds: ['https://example.com'] }],
      }),
    );
  });

  it('preserves the legacy unscoped draft slot', () => {
    setLocalDraft(baseDraft);

    expect(getLocalDraft()).toEqual(
      expect.objectContaining({
        casts: [{ text: 'hello', embeds: ['https://example.com'] }],
      }),
    );

    setLocalDraft(undefined);

    expect(getLocalDraft()).toBeUndefined();
  });

  it('removes retired snap builder recovery state while preserving the cast', () => {
    window.localStorage.setItem(
      SCOPED_STORAGE_KEY,
      JSON.stringify({
        'cast:new': {
          ...baseDraft,
          snapBuilder: { stale: true },
        },
      }),
    );

    expect(getLocalDraft('cast:new')).toEqual(
      expect.objectContaining({
        casts: [{ text: 'hello', embeds: ['https://example.com'] }],
      }),
    );
    expect(
      JSON.parse(window.localStorage.getItem(SCOPED_STORAGE_KEY) as string)[
        'cast:new'
      ].snapBuilder,
    ).toBeUndefined();
  });

  it('drops invalid scoped drafts instead of returning them', () => {
    window.localStorage.setItem(
      SCOPED_STORAGE_KEY,
      JSON.stringify({
        'cast:new': baseDraft,
        'reply:bad': { casts: [{ text: 123, embeds: [] }] },
      }),
    );

    expect(getLocalDraft('reply:bad')).toBeUndefined();
    expect(getLocalDraft('cast:new')).toEqual(
      expect.objectContaining({
        casts: [{ text: 'hello', embeds: ['https://example.com'] }],
      }),
    );
  });

  it('expires stale scoped drafts', () => {
    window.localStorage.setItem(
      SCOPED_STORAGE_KEY,
      JSON.stringify({
        'cast:new': {
          ...baseDraft,
          updatedAt: FIXED_NOW - 1000 * 60 * 60 * 24 * 15,
        },
      }),
    );

    expect(getLocalDraft('cast:new')).toBeUndefined();
  });
});
