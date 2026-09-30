import { usePrefetchFeedItems } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useCheckIfShouldSkipOptimisticPrefetch } from '~/hooks/data/useCheckIfShouldSkipOptimisticPrefetch';

// Hover-intent delay. A cursor sweeping across the channel sidebar passes over
// each link in well under this window, so without a delay every pass-over fires
// a feed-items POST for a channel the user never opens. Waiting for the pointer
// to actually rest on a link (a real intent-to-click signal) collapses a
// "one POST per link swept" burst into at most one POST per deliberate hover.
// Kept short so a genuine hover still warms the cache before the user clicks;
// if they click faster than this, the prefetch simply never fires and the
// destination page fetches the feed on mount exactly as it would on a cache
// miss (no extra request, no regression).
const HOVER_INTENT_DELAY_MS = 150;

// A single physical cursor can only intend one feed at a time, so one shared
// pending timer across every LinkToChannel / sidebar row / channel card is the
// correct model: hovering a new link cancels the previous link's still-pending
// prefetch. Module scope (rather than a per-hook ref) is what lets the
// independently-mounted link components share that one cursor's timer.
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingFeedKey: string | null = null;

const clearPendingPrefetch = () => {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = null;
  pendingFeedKey = null;
};

const useOptimisticallyPrefetchFeed = () => {
  const checkIfShouldSkipOptimisticPrefetch =
    useCheckIfShouldSkipOptimisticPrefetch();

  const prefetchFeedItems = usePrefetchFeedItems();

  const onNullFeedItemsResponse = useCallback(() => {
    // FIXME: Fill this out if we notice issues on web clients similar to Web
  }, []);

  return useCallback(
    ({ feedKey }: { feedKey: string }) => {
      // Same-link jitter first: onMouseOver refires as the pointer moves within
      // the same link (it bubbles from descendants). Keep the existing timer
      // running when the target feed hasn't changed. Checked BEFORE the skip
      // check on purpose, so a transient skip state (e.g. a scroll) landing
      // mid-hover doesn't cancel a timer for a link the pointer never left, and
      // so a jittering hover doesn't keep resetting the delay and never fire.
      if (pendingFeedKey === feedKey && pendingTimer !== null) {
        return;
      }

      if (checkIfShouldSkipOptimisticPrefetch()) {
        // The pointer moved onto a channel we won't prefetch right now (actively
        // scrolling / too many recent fetches). Drop any prefetch still queued
        // for the previously-hovered link so it doesn't fire for a feed the
        // cursor already left.
        clearPendingPrefetch();
        return;
      }

      clearPendingPrefetch();
      pendingFeedKey = feedKey;
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        pendingFeedKey = null;

        prefetchFeedItems({
          feedKey,
          feedType: 'default',
          updateState: false,
          onNullFeedItemsResponse,
        });
      }, HOVER_INTENT_DELAY_MS);
    },
    [
      checkIfShouldSkipOptimisticPrefetch,
      prefetchFeedItems,
      onNullFeedItemsResponse,
    ],
  );
};

export { HOVER_INTENT_DELAY_MS, useOptimisticallyPrefetchFeed };
