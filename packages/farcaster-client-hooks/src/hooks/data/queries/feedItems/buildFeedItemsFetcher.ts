import {
  ApiFeedSortMode,
  ApiGetFeedItems200Response,
  DEFAULT_TIMEOUT_FEED_ITEMS,
  FarcasterApiClient,
  TypedGetNextPageParamFunction,
  TypedGetPreviousPageParamFunction,
} from 'farcaster-client-data';

import { InternalEventingContextValue } from '../../../../providers/InternalEventingProvider';
import {
  BatchMergeIntoGloballyCachedCasts,
  CastUpdates,
} from '../../../../types';

export interface FeedItemsPageParam {
  olderThan: number | undefined;
  latestMainCastTimestamp: number | undefined;
  excludeItemIdPrefixes: string[] | undefined;
}

export const buildFeedItemsFetcher =
  ({
    apiClient,
    feedKey,
    feedType,
    updateState,
    batchUpdateGloballyCachedCast,
    internalEventsTracker,
    includeUserSuggestions,
    includeTrendingTopics,
    onNullFeedItemsResponse,
    sortMode,
    seedCastHash,
  }: {
    apiClient: FarcasterApiClient;
    feedKey: string;
    feedType: string;
    updateState: boolean;
    batchUpdateGloballyCachedCast: BatchMergeIntoGloballyCachedCasts;
    internalEventsTracker: InternalEventingContextValue;
    onNullFeedItemsResponse: () => void;
    includeUserSuggestions?: boolean;
    includeTrendingTopics?: boolean;
    sortMode?: ApiFeedSortMode;
    seedCastHash?: string;
  }) =>
  async ({ pageParam }: { pageParam?: FeedItemsPageParam }) => {
    const castViewEvents = internalEventsTracker.getAndRemoveCastViewEvents();

    try {
      const response = await apiClient.getFeedItems(
        {
          feedKey,
          feedType,
          olderThan: pageParam?.olderThan,
          latestMainCastTimestamp: pageParam?.latestMainCastTimestamp,
          excludeItemIdPrefixes: pageParam?.excludeItemIdPrefixes,
          castViewEvents,
          updateState,
          includeUserSuggestions,
          includeTrendingTopics,
          sortMode,
          seedCastHash,
        },
        { timeout: DEFAULT_TIMEOUT_FEED_ITEMS },
      );

      if (response.data === null) {
        onNullFeedItemsResponse();
        // eslint-disable-next-line no-console
        console.warn('data was null: buildFeedItemsFetcher');
        // Return the null page rather than falling through to the
        // response.data.result dereference below (which would throw and mask
        // this null-response signal). The page-param functions handle null
        // pages: getAllItemIdPrefixes skips them and the next-page function
        // stops paginating.
        return response.data;
      }

      const batchUpdates: CastUpdates[] = [];

      response.data.result.items.forEach((item) => {
        batchUpdates.push(item.cast);

        if (typeof item.replies !== 'undefined') {
          item.replies.forEach((reply) => {
            batchUpdates.push(reply);
          });
        }

        if (typeof item.cast.replies.casts !== 'undefined') {
          item.cast.replies.casts.forEach((reply) => {
            batchUpdates.push(reply);
          });
        }
      });

      batchUpdateGloballyCachedCast({ batchUpdates });

      return response.data;
    } catch (e) {
      internalEventsTracker.addBackCastViewEvents(castViewEvents);
      throw e;
    }
  };

// React Query invokes the page-param functions very frequently (on every
// hasNextPage / hasPreviousPage evaluation), and building the item-id prefix
// list (consumed as excludeItemIdPrefixes) is an O(all items across all pages)
// string transform. Memoize it on the allPages array reference (stable between
// fetches) so the prefix list is built once per page set instead of rebuilt on
// every call.
const itemIdPrefixesByPages = new WeakMap<
  ApiGetFeedItems200Response[],
  string[]
>();
function getAllItemIdPrefixes(
  allPages: ApiGetFeedItems200Response[],
  caller: string,
): string[] {
  const cached = itemIdPrefixesByPages.get(allPages);
  if (cached) {
    return cached;
  }
  const prefixes = allPages.flatMap((page) => {
    if (page === null) {
      // eslint-disable-next-line no-console
      console.warn(`page was null: ${caller}`);
      // Skip rather than dereference: if a null page ever reaches here the
      // warn would otherwise be followed by a throw on page.result.
      return [];
    }
    return page.result.items.map((item) => item.id.slice(2, 10).toLowerCase());
  });
  itemIdPrefixesByPages.set(allPages, prefixes);
  return prefixes;
}

export const feedItemsDetermineNextPageParams: TypedGetNextPageParamFunction<
  ApiGetFeedItems200Response,
  FeedItemsPageParam
> = (lastPage, allPages) => {
  if (lastPage === null) {
    // eslint-disable-next-line no-console
    console.warn('lastPage was null: feedItemsDetermineNextPageParams');
    // No next page when the last page is null; returning here also avoids the
    // lastPage.result dereference below that would otherwise throw.
    return undefined;
  }

  if (lastPage.result.items.length === 0) {
    return undefined;
  }

  const firstPage = allPages[0];

  const latestMainCastTimestamp = firstPage?.result.latestMainCastTimestamp;
  const allItemIdPrefixes = getAllItemIdPrefixes(
    allPages,
    'feedItemsDetermineNextPageParams',
  );

  return {
    olderThan: latestMainCastTimestamp,
    latestMainCastTimestamp,
    excludeItemIdPrefixes: allItemIdPrefixes,
  } satisfies FeedItemsPageParam;
};

export const feedItemsDeterminePrevPageParams: TypedGetPreviousPageParamFunction<
  ApiGetFeedItems200Response,
  FeedItemsPageParam
> = (firstPage, allPages) => {
  const latestMainCastTimestamp = firstPage?.result.latestMainCastTimestamp;

  const allItemIdPrefixes = getAllItemIdPrefixes(
    allPages,
    'feedItemsDeterminePrevPageParams',
  );

  return {
    olderThan: undefined,
    latestMainCastTimestamp,
    excludeItemIdPrefixes: allItemIdPrefixes,
  } satisfies FeedItemsPageParam;
};
