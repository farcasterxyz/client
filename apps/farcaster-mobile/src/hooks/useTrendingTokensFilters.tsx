import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  ApiGetTrendingTokensQueryParams,
  ApiTokenSourcePlatform,
  ApiTrendingTokensAmountMinimums,
  ApiTrendingTokensSortBy,
  ApiTrendingTokensTimeWindow,
} from 'farcaster-client-data';
import { useCallback, useMemo, useState } from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';

type TrendingTokensFiltersParams = Omit<
  ApiGetTrendingTokensQueryParams,
  'cursor' | 'limit'
>;

export interface TrendingTokensFilters {
  params: TrendingTokensFiltersParams;

  // Admin-only source state
  setSource: (source: 'codex' | 'farcaster') => void;

  setSelectedSortBy: (sortBy: ApiTrendingTokensSortBy) => void;
  setSelectedMinLiquidity: (
    minLiquidity?: ApiTrendingTokensAmountMinimums,
  ) => void;
  setHasCreatorData: (hasCreatorData: boolean) => void;

  // Network filters
  toggleSelectedChain: (chain: ApiChain) => void;
  toggleSelectedPlatform: (platform: ApiTokenSourcePlatform) => void;
  toggleTimeWindow: (timeWindow: ApiTrendingTokensTimeWindow) => void;

  // General state management
  resetFilters: () => void;
  resetSortBy: () => void;

  // Auxiliary
  filterCount: number;
}

export function useTrendingTokensFilters(
  defaultSortBy: ApiTrendingTokensSortBy = 'trending',
  initialParams?: Partial<TrendingTokensFiltersParams>,
): TrendingTokensFilters {
  const { trackEvent } = useAnalytics();

  const [params, setParams] = useState<TrendingTokensFiltersParams>({
    sortBy: 'trending',
    sortOrder: 'desc',
    ...initialParams,
  });

  const setSource = useCallback((source: 'codex' | 'farcaster') => {
    setParams((prev) => ({ ...prev, codex: source === 'codex' }));
  }, []);

  // --- Sort

  const setSelectedSortBy = useCallback(
    (sortBy: ApiTrendingTokensSortBy) => {
      trackEvent(AnalyticsEvent.ClickTrendingTokensFiltersOption, {
        sortBy,
      });

      setParams((prev) => {
        // Handle Triple Toggle Sort Options
        const sortableOptions = ['mcap', 'vol', 'buyers'];
        if (prev.sortBy === sortBy && sortableOptions.includes(sortBy)) {
          // Toggle Asc
          if (prev.sortOrder === 'desc') {
            return { ...prev, sortOrder: 'asc' };
          } else {
            // Back to trending
            return { ...prev, sortBy: defaultSortBy, sortOrder: 'desc' };
          }
        } else {
          // Maintain default sort order & toggle off or select option
          return {
            ...prev,
            sortBy: prev.sortBy === sortBy ? defaultSortBy : sortBy,
            sortOrder: 'desc',
          };
        }
      });
    },
    [trackEvent, defaultSortBy],
  );

  const resetSortBy = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      sortBy: defaultSortBy,
      sortOrder: 'desc',
    }));
  }, [defaultSortBy]);

  // --- Filters

  const toggleSelectedChain = useCallback(
    (chain: ApiChain) => {
      trackEvent(AnalyticsEvent.ClickTrendingTokensFiltersOption, {
        chain,
      });

      setParams((prev) => {
        // Deselect if the same chain
        const newChain = prev.chain === chain ? undefined : chain;

        // Disable Farcaster option for monad / bsc
        return { ...prev, chain: newChain };
      });
    },
    [trackEvent],
  );

  const toggleSelectedPlatform = useCallback(
    (platform: ApiTokenSourcePlatform) => {
      setParams((prev) => {
        const newPlatforms = [...(prev.platforms ?? [])];
        if (!newPlatforms.includes(platform)) {
          trackEvent(AnalyticsEvent.ClickTrendingTokensFiltersOption, {
            platform,
          });
          newPlatforms.push(platform);
        } else {
          newPlatforms.splice(newPlatforms.indexOf(platform), 1);
        }

        return { ...prev, platforms: newPlatforms };
      });
    },
    [trackEvent],
  );

  const toggleTimeWindow = useCallback(
    (timeWindow: ApiTrendingTokensTimeWindow) => {
      setParams((prev) => {
        trackEvent(AnalyticsEvent.ClickTrendingTokensFiltersOption, {
          timeWindow,
        });

        return { ...prev, timeWindow: timeWindow };
      });
    },
    [trackEvent],
  );

  const setSelectedMinLiquidity = useCallback(
    (minLiquidity?: ApiTrendingTokensAmountMinimums) => {
      if (minLiquidity) {
        trackEvent(AnalyticsEvent.ClickTrendingTokensFiltersOption, {
          minLiquidity,
        });
      }

      setParams((prev) => ({ ...prev, minLiquidity }));
    },
    [trackEvent],
  );

  const setHasCreatorData = useCallback(
    (hasCreatorData: boolean) => {
      if (hasCreatorData) {
        trackEvent(AnalyticsEvent.ClickTrendingTokensFiltersOption, {
          hasCreatorData,
        });
      }

      setParams((prev) => ({ ...prev, hasCreatorData }));
    },
    [trackEvent],
  );

  const resetFilters = useCallback(() => {
    // Maintain sortBy and source
    setParams((prev) => ({
      sortBy: prev.sortBy,
      sortOrder: 'desc',
    }));
  }, []);

  const filterCount = useMemo(() => {
    let count = 0;
    if (params.chain) {
      count++;
    }
    if (params.platforms?.length) {
      count++;
    }
    if (params.minLiquidity) {
      count++;
    }
    if (params.hasCreatorData) {
      count++;
    }
    return count;
  }, [params]);

  return {
    params,

    setSource,

    setSelectedSortBy,
    setSelectedMinLiquidity,
    setHasCreatorData,

    toggleSelectedChain,
    toggleSelectedPlatform,
    toggleTimeWindow,

    resetFilters,
    resetSortBy,

    filterCount,
  };
}
