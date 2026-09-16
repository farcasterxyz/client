/**
 * Single source of truth for search results pager tab order.
 * Used by SearchResults (tab bar + initial index) and OldExploreFallbackScreen (initial index when navigating to a tab).
 */
export const SEARCH_PAGER_ITEMS = [
  'Top',
  'Mini Apps',
  'Casts',
  'Users',
  'Tokens',
  'Channels',
] as const;

export type SearchPagerTab = (typeof SEARCH_PAGER_ITEMS)[number];

export const SEARCH_PAGER_INDEX = SEARCH_PAGER_ITEMS.reduce(
  (acc, tab, i) => ({ ...acc, [tab]: i }),
  {} as Record<SearchPagerTab, number>,
);
