// See: TopBar.tsx on farcaster-expo
export const TOP_BAR_Z_INDEX = 1000;

/** Right offset for search icon - must match FeedTopBar (pR4) and farcaster-expo TopBar for consistent placement across Home, Pulse, Chat, etc. */
export const SEARCH_ICON_RIGHT_OFFSET = 16;

/** Size of search icon in header/top bar (px). Use for HeaderSearchButton, FloatingSearchPressable. */
export const SEARCH_ICON_HEADER_SIZE = 22;

/** Touch target size for header search button (px). */
export const SEARCH_ICON_BUTTON_SIZE = 36;

/** Size of search icon inside search input bar (px). Use for FloatingSearchResults, DirectCastsFloatingSearch, etc. */
export const SEARCH_ICON_INPUT_SIZE = 18;
// We have to manage these as the floating search is built with
// a lot of absolutely positioned layouts on top. On iOS generally
// it handles per rendering order but Android needs specific values
// defined properly.
export const SEARCH_RESULTS_Z_INDEX = 1001;
export const SEARCH_PRESSABLE_Z_INDEX = 1002;
