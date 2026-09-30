import {
  usePrefetchExploreFeed as usePrefechExploreFeedInternal,
  usePrefetchTokenWatchlists,
  usePrefetchTrendingTokens,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useTrendingTokensFilters } from '~/hooks/useTrendingTokensFilters';

function usePrefetchExploreFeed() {
  const prefetch = usePrefechExploreFeedInternal();

  const prefetchTokenWatchlists = usePrefetchTokenWatchlists();

  const prefetchTrendingTokens = usePrefetchTrendingTokens();
  const trendingFiltersForPulse = useTrendingTokensFilters('trending-pulse', {
    sortBy: 'trending-pulse',
  });

  return useCallback(async () => {
    await prefetch();

    await prefetchTokenWatchlists();

    await prefetchTrendingTokens({ params: trendingFiltersForPulse.params });
  }, [
    prefetch,
    prefetchTokenWatchlists,
    prefetchTrendingTokens,
    trendingFiltersForPulse.params,
  ]);
}

export { usePrefetchExploreFeed };
