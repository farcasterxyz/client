// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  HOVER_INTENT_DELAY_MS,
  useOptimisticallyPrefetchFeed,
} from '~/hooks/data/useOptimisticallyPrefetchFeed';

const mocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
  shouldSkip: vi.fn(() => false),
}));

vi.mock('farcaster-client-hooks', () => ({
  usePrefetchFeedItems: () => mocks.prefetch,
}));

vi.mock('~/hooks/data/useCheckIfShouldSkipOptimisticPrefetch', () => ({
  useCheckIfShouldSkipOptimisticPrefetch: () => mocks.shouldSkip,
}));

describe('useOptimisticallyPrefetchFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.prefetch.mockClear();
    mocks.shouldSkip.mockReset();
    mocks.shouldSkip.mockReturnValue(false);
  });

  afterEach(() => {
    // Flush the module-level pending timer so state doesn't leak between tests.
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('does not fire a prefetch until the hover-intent delay elapses', () => {
    const { result } = renderHook(() => useOptimisticallyPrefetchFeed());

    result.current({ feedKey: 'memes' });
    expect(mocks.prefetch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(HOVER_INTENT_DELAY_MS - 1);
    expect(mocks.prefetch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mocks.prefetch).toHaveBeenCalledTimes(1);
    expect(mocks.prefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        feedKey: 'memes',
        feedType: 'default',
        updateState: false,
      }),
    );
  });

  it('fires only once — for the last channel — when the cursor sweeps across many links', () => {
    const { result } = renderHook(() => useOptimisticallyPrefetchFeed());

    // Sweep: several different channels hovered in quick succession, each well
    // within the intent delay of the previous one.
    ['art', 'dev', 'food', 'music', 'news'].forEach((feedKey, i) => {
      vi.advanceTimersByTime(i === 0 ? 0 : 20);
      result.current({ feedKey });
    });

    vi.advanceTimersByTime(HOVER_INTENT_DELAY_MS);

    expect(mocks.prefetch).toHaveBeenCalledTimes(1);
    expect(mocks.prefetch).toHaveBeenCalledWith(
      expect.objectContaining({ feedKey: 'news' }),
    );
  });

  it('does not reset the timer on repeated hovers of the same channel', () => {
    const { result } = renderHook(() => useOptimisticallyPrefetchFeed());

    // onMouseOver refires as the pointer jitters within the same link.
    result.current({ feedKey: 'memes' });
    vi.advanceTimersByTime(100);
    result.current({ feedKey: 'memes' });
    result.current({ feedKey: 'memes' });

    // 100ms already elapsed since the first hover; the timer must not have been
    // pushed back, so 50ms more (150 total) fires it.
    vi.advanceTimersByTime(HOVER_INTENT_DELAY_MS - 100);
    expect(mocks.prefetch).toHaveBeenCalledTimes(1);
    expect(mocks.prefetch).toHaveBeenCalledWith(
      expect.objectContaining({ feedKey: 'memes' }),
    );
  });

  it('never schedules a prefetch when the skip check says to skip', () => {
    mocks.shouldSkip.mockReturnValue(true);
    const { result } = renderHook(() => useOptimisticallyPrefetchFeed());

    result.current({ feedKey: 'memes' });
    vi.advanceTimersByTime(HOVER_INTENT_DELAY_MS * 2);

    expect(mocks.prefetch).not.toHaveBeenCalled();
  });

  it('cancels a pending prefetch when the next hover lands on a different channel in a skip state', () => {
    const { result } = renderHook(() => useOptimisticallyPrefetchFeed());

    // Hover A schedules a prefetch.
    result.current({ feedKey: 'art' });
    vi.advanceTimersByTime(50);

    // The cursor moves onto a DIFFERENT channel while scrolling / rate-limited.
    // A's still-pending timer must be cancelled, not left to fire for a feed the
    // cursor has already left.
    mocks.shouldSkip.mockReturnValue(true);
    result.current({ feedKey: 'dev' });

    vi.advanceTimersByTime(HOVER_INTENT_DELAY_MS * 2);
    expect(mocks.prefetch).not.toHaveBeenCalled();
  });

  it('keeps a resting hover timer alive when skip flips true on the same link (jitter)', () => {
    const { result } = renderHook(() => useOptimisticallyPrefetchFeed());

    // Rest on A -> schedule a prefetch.
    result.current({ feedKey: 'art' });
    vi.advanceTimersByTime(50);

    // A transient skip state (e.g. a scroll) begins while the pointer is still
    // on A, and a bubbled onMouseOver refires for the SAME link. The same-link
    // guard runs before the skip check, so the already-earned timer survives and
    // still fires for A.
    mocks.shouldSkip.mockReturnValue(true);
    result.current({ feedKey: 'art' });

    vi.advanceTimersByTime(HOVER_INTENT_DELAY_MS);
    expect(mocks.prefetch).toHaveBeenCalledTimes(1);
    expect(mocks.prefetch).toHaveBeenCalledWith(
      expect.objectContaining({ feedKey: 'art' }),
    );
  });

  it('re-arms after the timer fires, so a later same-link hover schedules again', () => {
    const { result } = renderHook(() => useOptimisticallyPrefetchFeed());

    result.current({ feedKey: 'memes' });
    vi.advanceTimersByTime(HOVER_INTENT_DELAY_MS);
    expect(mocks.prefetch).toHaveBeenCalledTimes(1);

    // Once the timer fires, pendingFeedKey/pendingTimer reset, so a fresh hover
    // on the same link schedules a new prefetch. The resulting
    // prefetchInfiniteQuery is deduped by the 3-min staleTime (see
    // channelFeedPrefetchDedup.test.ts), so this does NOT cause a second POST.
    result.current({ feedKey: 'memes' });
    vi.advanceTimersByTime(HOVER_INTENT_DELAY_MS);
    expect(mocks.prefetch).toHaveBeenCalledTimes(2);
  });
});
