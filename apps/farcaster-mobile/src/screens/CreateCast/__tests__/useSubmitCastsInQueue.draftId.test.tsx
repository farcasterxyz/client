import { act, renderHook } from '@testing-library/react-native';

import { useSubmitCastsInQueue } from '../useSubmitCastsInQueue';

const mockStoreDraftCaststorm = jest.fn();
const mockCreateCast = jest.fn();
const mockDiscardDraftCast = jest.fn();
const mockDeleteCast = jest.fn();
const mockTrackCastReaction = jest.fn();
const mockPrefetchThread = jest.fn();
const mockOptimisticallyAddNewCastToThread = jest.fn();
const mockToastShow = jest.fn();
const mockDispatch = jest.fn();
const mockRequestReview = jest.fn();
const mockTrackEvent = jest.fn();
const mockSetLocalDraft = jest.fn();

// Mutable queue state shared with the mocked CastQueueProvider. Tests populate
// entries keyed by queueId before rendering the hook.
const mockQueueState: Record<string, unknown> = {};

jest.mock('farcaster-analytics', () => ({
  AnalyticsEvent: { CastMessage: 'cast_message' },
}));

jest.mock('farcaster-client-data', () => ({
  getCastHashPrefix: () => 'prefix',
  getTokenEmbedUrl: () => 'token-url',
  parseCAIP19Token: () => null,
}));

jest.mock('farcaster-client-hooks', () => ({
  CastReactionType: { Quote: 'quote', Reply: 'reply' },
  sleep: () => Promise.resolve(),
  useCreateCast: () => mockCreateCast,
  useDeleteCast: () => mockDeleteCast,
  useDiscardDraftCast: () => mockDiscardDraftCast,
  useFetchOpenGraphMetadata: () => ({
    getCachedOpenGraphMetadataSnapshot: () => new Map(),
  }),
  // Returns the fn the hook calls per published reply. This factory replaces
  // the whole module, so any hook newly used by useSubmitCastsInQueue must be
  // stubbed here or it resolves to undefined at render.
  useOptimisticallyAddNewCastToThread: () =>
    mockOptimisticallyAddNewCastToThread,
  usePrefetchUserThreadCasts: () => mockPrefetchThread,
  useStoreDraftCaststorm: () => mockStoreDraftCaststorm,
  useTrackCastReaction: () => mockTrackCastReaction,
}));

jest.mock('farcaster-expo', () => ({
  useRootToast: () => ({ show: mockToastShow }),
}));

jest.mock('~/contexts/AnalyticsProvider', () => ({
  useAnalytics: () => ({ trackEvent: mockTrackEvent }),
}));

jest.mock('~/contexts/AppStoreReviewProvider', () => ({
  useAppStoreReview: () => ({ requestReview: mockRequestReview }),
}));

jest.mock('~/contexts/CastQueueProvider', () => ({
  useCastQueue: () => ({ reducer: [mockQueueState, mockDispatch] }),
}));

jest.mock('~/contexts/UserAppContextProvider', () => ({
  useUserAppContext: () => ({ regularCastByteLimit: 320 }),
}));

jest.mock('~/hooks/data/useCurrentUser', () => ({
  useCurrentUser_UNSAFE: () => ({ fid: 123 }),
}));

jest.mock('~/utils/CastUtils', () => ({
  buildApiCastUrlEmbedFromMetadata: jest.fn(),
}));

jest.mock('~/utils/ErrorUtils', () => ({
  trackError: jest.fn(),
}));

jest.mock('../dedupeEmbedReferences', () => ({
  dedupeEmbedReferences: (embeds: string[]) => embeds,
}));

jest.mock('../getDedupedEmbedsArrayFromOptimisticEmbeds', () => ({
  getDedupedEmbedsArrayFromOptimisticEmbeds: jest.fn(),
}));

jest.mock('../LocalDrafts', () => ({
  setLocalDraft: (...args: unknown[]) => mockSetLocalDraft(...args),
}));

jest.mock('../OptimisticMediaEmbedsProvider', () => ({
  getOptimisticMediaLookupKey: () => ({ lookupKey: 'lookup' }),
  useOptimisticMediaEmbeds: () => [{}],
}));

function makePayload({
  text,
  queueIdOverrideForEmbeds,
  activeDraftId,
  scheduledAt,
  parentCastHash,
}: {
  text: string;
  queueIdOverrideForEmbeds?: string;
  activeDraftId?: string;
  scheduledAt?: Date;
  parentCastHash?: string;
}) {
  return {
    params: {
      casts: [
        {
          localKey: 0,
          text,
          embeds: [],
          userMentions: [],
          channelMentions: [],
          tokenMentions: [],
        },
      ],
      activeDraftId,
      scheduledAt,
      channelKey: undefined,
      feed: undefined,
      includeReason: undefined,
      quoteReactions: [],
      tokenKey: undefined,
      parentCastHash,
      localDraftKey: 'draft-key',
      queueIdOverrideForEmbeds,
      onSuccess: undefined,
      onError: undefined,
    },
    queueState: { queueId: 'x', status: 'in-progress' },
    castTarget: undefined,
  };
}

function getAutoSaveDraftId(callIndex: number): string | undefined {
  return mockStoreDraftCaststorm.mock.calls[callIndex][0].caststorm.draftId;
}

function getAutoSaveScheduledAt(callIndex: number): Date | undefined {
  return mockStoreDraftCaststorm.mock.calls[callIndex][0].scheduledAt;
}

function getAutoSaveParent(callIndex: number): { hash: string } | undefined {
  return mockStoreDraftCaststorm.mock.calls[callIndex][0].caststorm.parent;
}

describe('useSubmitCastsInQueue pre-publish autosave draftId scoping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(mockQueueState)) {
      delete mockQueueState[key];
    }
  });

  it('does not reuse a failed cast draftId for an unrelated later publish', async () => {
    // Both publishes fail so the pre-publish auto-save draftId is retained.
    mockCreateCast.mockRejectedValue(new Error('network'));
    mockStoreDraftCaststorm
      .mockResolvedValueOnce({ result: { draft: { draftId: 'draft-A' } } })
      .mockResolvedValueOnce({ result: { draft: { draftId: 'draft-B' } } });

    mockQueueState['queue-A'] = makePayload({ text: 'Cast A' });
    mockQueueState['queue-B'] = makePayload({ text: 'Cast B' });

    const { result } = renderHook(() => useSubmitCastsInQueue());

    await act(async () => {
      await result.current({ queueId: 'queue-A' });
    });
    await act(async () => {
      await result.current({ queueId: 'queue-B' });
    });

    expect(mockStoreDraftCaststorm).toHaveBeenCalledTimes(2);
    // Cast A's auto-save has no prior draftId.
    expect(getAutoSaveDraftId(0)).toBeUndefined();
    // The unrelated cast B must NOT upsert cast A's recovery draft. Before the
    // fix this passed 'draft-A', clobbering cast A's recovery content.
    expect(getAutoSaveDraftId(1)).toBeUndefined();
  });

  it('reuses the same draftId when retrying the same cast', async () => {
    mockCreateCast.mockRejectedValue(new Error('network'));
    mockStoreDraftCaststorm
      .mockResolvedValueOnce({ result: { draft: { draftId: 'draft-A' } } })
      .mockResolvedValueOnce({ result: { draft: { draftId: 'draft-A' } } });

    // First attempt: castQueueId resolves to 'queue-A' (no embeds override).
    mockQueueState['queue-A'] = makePayload({ text: 'Cast A' });
    // Retry: a new queueId is minted, but queueIdOverrideForEmbeds points back
    // to the original queueId, so castQueueId stays 'queue-A'.
    mockQueueState['queue-A-retry'] = makePayload({
      text: 'Cast A',
      queueIdOverrideForEmbeds: 'queue-A',
    });

    const { result } = renderHook(() => useSubmitCastsInQueue());

    await act(async () => {
      await result.current({ queueId: 'queue-A' });
    });
    await act(async () => {
      await result.current({ queueId: 'queue-A-retry' });
    });

    expect(mockStoreDraftCaststorm).toHaveBeenCalledTimes(2);
    expect(getAutoSaveDraftId(0)).toBeUndefined();
    // Retry reuses cast A's draftId so the recovery draft upserts in place.
    expect(getAutoSaveDraftId(1)).toBe('draft-A');
  });

  it('upserts the opened draft on a failed publish instead of creating a duplicate', async () => {
    // Publishing a draft that was opened for editing (activeDraftId) then
    // failing must NOT leave a second, near-identical recovery draft behind.
    // The pre-publish auto-save should upsert the opened draft in place.
    mockCreateCast.mockRejectedValue(new Error('network'));
    mockStoreDraftCaststorm.mockResolvedValueOnce({
      result: { draft: { draftId: 'opened-draft' } },
    });

    mockQueueState['queue-A'] = makePayload({
      text: 'Cast A',
      activeDraftId: 'opened-draft',
    });

    const { result } = renderHook(() => useSubmitCastsInQueue());

    await act(async () => {
      await result.current({ queueId: 'queue-A' });
    });

    expect(mockStoreDraftCaststorm).toHaveBeenCalledTimes(1);
    // The auto-save reuses the opened draft's id so it upserts in place rather
    // than minting a duplicate recovery draft. Before the fix this was
    // undefined, creating a brand-new draft alongside the opened one.
    expect(getAutoSaveDraftId(0)).toBe('opened-draft');
    // The opened draft is upserted, not separately discarded, so a failed
    // publish leaves exactly one draft behind.
    expect(mockDiscardDraftCast).not.toHaveBeenCalled();
  });

  it('re-sends a scheduled draft schedule so a failed publish keeps the send', async () => {
    // The backend treats scheduledAt as authoritative on every store: upserting
    // the opened draft without it would silently unschedule it. Publishing a
    // scheduled draft then failing must preserve the schedule.
    const scheduledAt = new Date(1_700_000_000_000);
    mockCreateCast.mockRejectedValue(new Error('network'));
    mockStoreDraftCaststorm.mockResolvedValueOnce({
      result: { draft: { draftId: 'scheduled-draft' } },
    });

    mockQueueState['queue-A'] = makePayload({
      text: 'Cast A',
      activeDraftId: 'scheduled-draft',
      scheduledAt,
    });

    const { result } = renderHook(() => useSubmitCastsInQueue());

    await act(async () => {
      await result.current({ queueId: 'queue-A' });
    });

    expect(getAutoSaveDraftId(0)).toBe('scheduled-draft');
    // The schedule is re-sent so the upsert doesn't clear it.
    expect(getAutoSaveScheduledAt(0)).toBe(scheduledAt);
  });

  it('re-sends the reply parent so a failed publish keeps the reply target', async () => {
    // The server overwrites the whole draft payload on upsert and `parent`
    // lives only in that payload (no parent column). Editing a reply-caststorm
    // draft without re-sending parent would silently clear the reply target.
    mockCreateCast.mockRejectedValue(new Error('network'));
    mockStoreDraftCaststorm.mockResolvedValueOnce({
      result: { draft: { draftId: 'reply-draft' } },
    });

    mockQueueState['queue-A'] = makePayload({
      text: 'Cast A',
      activeDraftId: 'reply-draft',
      parentCastHash: '0xparent',
    });

    const { result } = renderHook(() => useSubmitCastsInQueue());

    await act(async () => {
      await result.current({ queueId: 'queue-A' });
    });

    expect(getAutoSaveDraftId(0)).toBe('reply-draft');
    // The reply target is re-sent so the upsert doesn't clear it.
    expect(getAutoSaveParent(0)).toEqual({ hash: '0xparent' });
  });

  it('clears the tracked draftId after a successful publish', async () => {
    mockStoreDraftCaststorm
      .mockResolvedValueOnce({ result: { draft: { draftId: 'draft-A' } } })
      .mockResolvedValueOnce({ result: { draft: { draftId: 'draft-A2' } } });
    mockCreateCast.mockResolvedValue({
      result: { cast: { hash: '0xhash', author: { username: 'alice' } } },
    });

    mockQueueState['queue-A'] = makePayload({ text: 'Cast A' });

    const { result } = renderHook(() => useSubmitCastsInQueue());

    // First publish succeeds: the recovery draft is discarded and the tracked
    // draftId for this castQueueId is cleared.
    await act(async () => {
      await result.current({ queueId: 'queue-A' });
    });
    expect(mockDiscardDraftCast).toHaveBeenCalledWith({
      draftId: 'draft-A',
      castChannelKey: undefined,
    });

    // A later publish reusing the same castQueueId must start fresh instead of
    // upserting the already-published (and discarded) draft.
    mockCreateCast.mockRejectedValueOnce(new Error('network'));
    mockQueueState['queue-A'] = makePayload({ text: 'Cast A second time' });
    await act(async () => {
      await result.current({ queueId: 'queue-A' });
    });

    expect(getAutoSaveDraftId(1)).toBeUndefined();
  });
});
