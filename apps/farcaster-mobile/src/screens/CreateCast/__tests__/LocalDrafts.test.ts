import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('~/utils/ErrorUtils', () => ({
  trackError: jest.fn(),
}));

import {
  getLocalDraft,
  getReplyLocalDraftKey,
  LOCAL_DRAFT_TOP_LEVEL_KEY,
  LocalDraft,
  setLocalDraft,
} from '../LocalDrafts';

const draft: LocalDraft = {
  queuedCasts: [],
  channelKey: undefined,
  embedUrls: {},
  parentCastHash: undefined,
  scheduledAt: undefined,
};

describe('LocalDrafts', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips a saved draft', async () => {
    await setLocalDraft(draft);
    expect(await getLocalDraft()).toEqual(draft);
  });

  it('round-trips a scoped reply draft without populating top-level state', async () => {
    const replyKey = getReplyLocalDraftKey('0xabc');

    await setLocalDraft(draft, replyKey);

    expect(await getLocalDraft(replyKey)).toEqual(draft);
    expect(await getLocalDraft()).toBeUndefined();
  });

  it('clears only the requested scoped draft', async () => {
    const replyKey = getReplyLocalDraftKey('0xabc');
    const otherReplyKey = getReplyLocalDraftKey('0xdef');

    await setLocalDraft(draft, replyKey);
    await setLocalDraft(
      {
        ...draft,
        channelKey: 'farcaster',
      },
      otherReplyKey,
    );
    await setLocalDraft(undefined, replyKey);

    expect(await getLocalDraft(replyKey)).toBeUndefined();
    expect(await getLocalDraft(otherReplyKey)).toEqual({
      ...draft,
      channelKey: 'farcaster',
    });
  });

  it('falls back to the legacy singleton for top-level drafts only', async () => {
    await AsyncStorage.setItem('local-caststorm-draft', JSON.stringify(draft));

    expect(await getLocalDraft(LOCAL_DRAFT_TOP_LEVEL_KEY)).toEqual(draft);
    expect(await getLocalDraft(getReplyLocalDraftKey('0xabc'))).toBeUndefined();
  });

  // Regression guard: clearing the draft must read back as `undefined`, not
  // `null`. Previously setLocalDraft(undefined) persisted the string "null"
  // (via safeStringify), which getLocalDraft() then parsed back to `null` —
  // slipping past `typeof === 'undefined'` guards and crashing readers on
  // `localDraft.queuedCasts`. The fix deletes the key instead of writing it.
  it('returns undefined (not null) after the draft is cleared', async () => {
    await setLocalDraft(draft);
    await setLocalDraft(undefined);

    const result = await getLocalDraft();
    expect(result).toBeUndefined();
    expect(result).not.toBeNull();
  });
});
