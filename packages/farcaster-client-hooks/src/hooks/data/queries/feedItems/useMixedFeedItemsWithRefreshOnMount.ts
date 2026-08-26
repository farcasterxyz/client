import type { ApiFeedSortMode } from 'farcaster-client-data';
import { useRef } from 'react';

import { usePurged } from '../../../../providers/PurgedProvider';
import { buildFeedItemsKey } from './buildFeedItemsKey';
import { useMixedFeedItems } from './useMixedFeedItems';
import { usePurgeFeedItems } from './usePurgeFeedItems';

const useMixedFeedItemsWithRefreshOnMount = ({
  feedKey,
  feedType,
  updateState,
  skipPurge,
  onNullFeedItemsResponse,
  sortMode,
}: {
  feedKey: string;
  feedType: string;
  updateState: boolean;
  skipPurge?: boolean;
  onNullFeedItemsResponse: () => void;
  sortMode?: ApiFeedSortMode;
}) => {
  const queryKey = buildFeedItemsKey({
    feedKey,
    feedType,
    sortMode: sortMode?.type,
  });
  const purgeFeedItems = usePurgeFeedItems();

  // Invalidating or using useQueryWithRefreshOnMount or
  // all result in race conditions as the refresh may be done with stale params.
  // We do what usePurgedInfiniteQuery does and clear the cache in-line, ensuring
  // we block and fully reload the feed

  // We need to rely on context here, because if the component suspends, its references will be lost
  const { checkIfRecentlyPurged, markAsPurged } = usePurged();

  // We also want to keep a flag to know if the component has successfully rendered, because state changes (e.g. loading a new page of data for an infinitely scrollable view) will cause re-renders. We only want to purge data on the initial render.
  const hasRenderedRef = useRef(false);

  if (
    !hasRenderedRef.current &&
    !checkIfRecentlyPurged({ queryKey }) &&
    // Avoid purging home feed so we can render cached content faster on startup
    !skipPurge
  ) {
    purgeFeedItems({ feedKey });
    markAsPurged({ queryKey });
  }

  hasRenderedRef.current = true;

  return useMixedFeedItems({
    feedKey,
    feedType,
    updateState,
    onNullFeedItemsResponse,
    sortMode,
  });
};

export { useMixedFeedItemsWithRefreshOnMount };
