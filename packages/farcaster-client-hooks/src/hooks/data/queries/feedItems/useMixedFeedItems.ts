import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ApiFeedSortMode,
  ApiGetFeedItems200Response,
  TypedGetNextPageParamFunction,
  TypedGetPreviousPageParamFunction,
} from 'farcaster-client-data';
import { useCallback, useMemo, useRef } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useInternalEventing } from '../../../../providers/InternalEventingProvider';
import { usePurged } from '../../../../providers/PurgedProvider';
import {
  CastFeedItem,
  FeedItemType,
  MixedFeedItem,
  TrendingTopicsFeedItem,
  UserRecommendationsFeedItem,
} from '../../../../types';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import {
  buildFeedItemsFetcher,
  feedItemsDetermineNextPageParams,
  feedItemsDeterminePrevPageParams,
  FeedItemsPageParam,
} from './buildFeedItemsFetcher';
import { buildFeedItemsKey } from './buildFeedItemsKey';

const useMixedFeedItems = ({
  feedKey,
  feedType,
  updateState,
  onNullFeedItemsResponse,
  purgeToFirstPageOnMount,
  sortMode,
}: {
  feedKey: string;
  feedType: string;
  updateState: boolean;
  onNullFeedItemsResponse: () => void;
  purgeToFirstPageOnMount?: boolean;
  sortMode?: ApiFeedSortMode;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchUpdateGloballyCachedCast = useBatchMergeIntoGloballyCachedCasts();
  const internalEventsTracker = useInternalEventing();

  const queryKey = useMemo(
    () => [
      ...buildFeedItemsKey({ feedKey, feedType, sortMode: sortMode?.type }),
    ],
    [feedKey, feedType, sortMode],
  );

  const prevParams = useRef<FeedItemsPageParam | undefined>(undefined);
  const nextParams = useRef<FeedItemsPageParam | undefined>(undefined);

  /*
   * Same as usePurgedInfiniteQuery, but need it here because of the complex param handling we do
   */
  const queryClient = useQueryClient();

  // We need to rely on context here, because if the component suspends, its references will be lost
  const { checkIfRecentlyPurged, markAsPurged } = usePurged();

  // We also want to keep a flag to know if the component has successfully rendered, because state changes (e.g. loading a new page of data for an infinitely scrollable view) will cause re-renders. We only want to purge data on the initial render.
  const hasRenderedRef = useRef(false);

  if (
    purgeToFirstPageOnMount &&
    !hasRenderedRef.current &&
    !checkIfRecentlyPurged({ queryKey })
  ) {
    markAsPurged({ queryKey });

    queryClient.setQueryData<InfiniteData<ApiGetFeedItems200Response>>(
      queryKey,
      (data) => {
        if (!data) {
          return data;
        }

        return {
          pageParams: data.pageParams.slice(0, 1),
          pages: data.pages.slice(0, 1),
        };
      },
    );
  }

  hasRenderedRef.current = true;

  /*
   * End usePurgedInfiniteQuery part
   */

  // React query calls the param generation functions very often, so we memoize the results
  // as calculating it is expensive (we loop though all items to generate arrays of item IDs)
  const getNextPageParams: TypedGetNextPageParamFunction<
    ApiGetFeedItems200Response,
    FeedItemsPageParam
  > = (lastPage, allPages) => {
    nextParams.current = feedItemsDetermineNextPageParams(lastPage, allPages);
    return nextParams.current;
  };

  const getPrevPageParams: TypedGetPreviousPageParamFunction<
    ApiGetFeedItems200Response,
    FeedItemsPageParam
  > = (firstPage, allPages) => {
    prevParams.current = feedItemsDeterminePrevPageParams(firstPage, allPages);
    return prevParams.current;
  };

  const query = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: queryKey,

    queryFn: buildFeedItemsFetcher({
      apiClient,
      feedKey,
      feedType,
      updateState,
      batchUpdateGloballyCachedCast,
      internalEventsTracker,
      onNullFeedItemsResponse,
      includeUserSuggestions: true,
      includeTrendingTopics: true,
      sortMode,
    }),

    getNextPageParam: getNextPageParams,
    getPreviousPageParam: getPrevPageParams,

    // Prevent background refetches from silently updating prevFirstItemId before
    // the user's explicit pull-to-refresh. With refetchOnWindowFocus:true (default),
    // switching app focus triggers a background refetch that makes the cache
    // already-fresh, so a subsequent manual pull-to-refresh finds the same first
    // item → hasNewItems:false even though the user expected to see new content.
    // Pull-to-refresh is the explicit mechanism for refreshing this feed.
    refetchOnWindowFocus: false,

    // Save updateState so that users can use useSetFeedItemsAsSeenIfPrefetched to set the feed
    // as seen when the component is rendered and the feed has been prefetched but not loaded again
    meta: { updateState },
  });

  // Override fetchPreviousPage to do a full first-page refetch instead of an
  // incremental prepend.
  //
  // The old approach used React Query's fetchPreviousPage() which sent
  // excludeItemIdPrefixes (all cached item IDs) and latestMainCastTimestamp to
  // the backend, asking for only NEW items not already in the cache. This broke
  // on Android where the app stays alive across sessions: if the backend's
  // curated feed re-ranked without genuinely new posts, the exclusion list
  // filtered everything out → empty response → "all caught up" even though the
  // feed had changed. On iOS the OS kills apps frequently, so refetchOnMount
  // did a full refetch (no exclusion list) that always showed the latest feed.
  //
  // Now we purge the cache to a single page and do a clean refetch with
  // pageParam=undefined — exactly what iOS gets on a fresh mount. This gives
  // consistent pull-to-refresh behavior across both platforms.
  const baseRefetch = query.refetch;
  const fetchPreviousPage = useCallback(async (): Promise<{
    hasNewItems: boolean;
    topItemIds: string[];
    prevTopItemIds: string[];
    replaceFeed: boolean;
    itemsCount: number;
    responseAtMs: number;
  }> => {
    // Cancel any existing query to prevent race conditions with in-flight
    // fetchNextPage or background refetch requests.
    await queryClient.cancelQueries({
      queryKey: queryKey,
    });

    // Snapshot the top 15 item IDs before the refresh so we can detect whether
    // the backend returned a different ranking. We compare the full top slice
    // (not just the first id) because the backend can legitimately keep the
    // same top cast while re-ordering the ones below it.
    const TOP_N_FOR_COMPARISON = 15;
    const prevTopItemIds =
      queryClient
        .getQueryData<InfiniteData<ApiGetFeedItems200Response>>(queryKey)
        ?.pages[0]?.result.items.slice(0, TOP_N_FOR_COMPARISON)
        .map((item) => item.id) ?? [];

    // Purge to a single page and reset the page param to the initial undefined
    // so that refetch() fetches a clean first page from the backend without any
    // excludeItemIdPrefixes or latestMainCastTimestamp filters.
    queryClient.setQueryData<InfiniteData<ApiGetFeedItems200Response>>(
      queryKey,
      (data) => {
        if (!data) {
          return data;
        }

        return {
          pageParams: [undefined],
          pages: data.pages.slice(0, 1),
        };
      },
    );

    // Full refetch of the (now single-page) query. This calls queryFn with
    // pageParam=undefined, giving us the default first page of the feed with
    // the latest ranking — identical to what iOS gets via refetchOnMount.
    const result = await baseRefetch();
    const responseAtMs = Date.now();

    // Clear cached pagination params so getNextPageParam / getPreviousPageParam
    // recalculate from the fresh data on the next call.
    prevParams.current = undefined;
    nextParams.current = undefined;

    const firstPageResult = result.data?.pages[0]?.result;
    const topItemIds =
      firstPageResult?.items.slice(0, TOP_N_FOR_COMPARISON).map((i) => i.id) ??
      [];
    const hasNewItems =
      topItemIds.length !== prevTopItemIds.length ||
      topItemIds.some((id, index) => id !== prevTopItemIds[index]);

    return {
      hasNewItems,
      topItemIds,
      prevTopItemIds,
      replaceFeed: firstPageResult?.replaceFeed === true,
      itemsCount: firstPageResult?.items.length ?? 0,
      responseAtMs,
    };
  }, [baseRefetch, queryClient, queryKey]);

  // Override fetchNextPage because we need some extra functionality
  const baseFetchNextPage = query.fetchNextPage;
  const fetchNextPage = useCallback(async () => {
    const result = await baseFetchNextPage();

    // Clear cached params so getNextPageParam recalculates against the
    // freshest page 0 next time it's asked.
    prevParams.current = undefined;
    nextParams.current = undefined;

    // Race condition: by the time a next page is fetched, page 0 may have
    // mutated (cast updates, in-flight pull-to-refresh) so the
    // `olderThan` we sent no longer aligns with page 0's
    // `latestMainCastTimestamp`. The backend then returns an empty page
    // because the exclusion window doesn't match anything.
    //
    // We DROP the empty page so the cache stays consistent (otherwise an
    // empty page sticks at the tail and confuses pagination), but we do
    // NOT auto-retry with the recalculated params. The previous code
    // re-entered fetchNextPage immediately, which appended a slice of the
    // backend ranking that the user never asked for — visually it looked
    // like "random casts appearing at the bottom while loading". The user
    // can trigger a fresh fetchNextPage themselves with another scroll;
    // meanwhile their current scroll position only ever shows casts that
    // matched their original onEndReached request.
    const pages = result.data?.pages;
    const pageParams = result.data?.pageParams;
    if (!pages || !pageParams || pages.length <= 1) {
      return;
    }
    const lastPageIndex = pages.length - 1;
    const lastPage = pages[lastPageIndex];
    if (lastPage === null) {
      // eslint-disable-next-line no-console
      console.warn('lastPage was null: useMixedFeedItems.fetchNextPage');
      return;
    }
    if (lastPage.result.items.length !== 0) {
      return;
    }
    const requestOlderThan = (pageParams as FeedItemsPageParam[])[lastPageIndex]
      .olderThan;
    const firstPage = pages[0];
    if (firstPage === null) {
      // eslint-disable-next-line no-console
      console.warn('firstPage was null: useMixedFeedItems.fetchNextPage');
      return;
    }
    const firstPageLatestMainCastTimestamp =
      firstPage.result.latestMainCastTimestamp;
    if (
      requestOlderThan &&
      firstPageLatestMainCastTimestamp &&
      requestOlderThan !== firstPageLatestMainCastTimestamp
    ) {
      queryClient.setQueryData<InfiniteData<ApiGetFeedItems200Response>>(
        queryKey,
        (data) => {
          if (!data) {
            return data;
          }
          return {
            pageParams: data.pageParams.slice(0, -1),
            pages: data.pages.slice(0, -1),
          };
        },
      );
    }
  }, [baseFetchNextPage, queryClient, queryKey]);

  const { data } = query;

  const flatItems = useMemo(
    () =>
      data?.pages.flatMap((page) => {
        if (page === null) {
          // eslint-disable-next-line no-console
          console.warn('page was null: useFeedItems.deduplicate');
        }

        return [
          ...page.result.items.map(
            (item) =>
              ({
                type: FeedItemType.Cast as const,
                item: item,
              }) as CastFeedItem,
          ),
          ...(page.result.suggestedUsers &&
          page.result.suggestedUsers.length > 0
            ? [
                {
                  type: FeedItemType.UserRecommendations as const,
                  item: { users: page.result.suggestedUsers },
                } as UserRecommendationsFeedItem,
              ]
            : []),
          ...(page.result.trendingTopics &&
          page.result.trendingTopics.length > 0
            ? [
                {
                  type: FeedItemType.TrendingTopics as const,
                  item: { topics: page.result.trendingTopics },
                } as TrendingTopicsFeedItem,
              ]
            : []),
        ];
      }) || [],
    [data],
  );

  const uniqueFeedItems: MixedFeedItem[] = useMemo(() => {
    const seen = new Set<string>();
    const filteredItems = flatItems.filter((item) => {
      if (item.type !== FeedItemType.Cast) return true;

      const id = item.item.id;
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });

    return filteredItems;
  }, [flatItems]);

  const userSuggestions = useMemo(
    () => data?.pages.flatMap((page) => page.result.suggestedUsers || []) || [],
    [data],
  );

  const trendingTopics = useMemo(
    () => data?.pages.flatMap((page) => page.result.trendingTopics || []) || [],
    [data],
  );

  // Only include the specific query properties we need to avoid reference changes
  const {
    isPending,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    isLoading,
    isRefetching,
    status,
    fetchStatus,
  } = query;

  return useMemo(
    () => ({
      isPending,
      isError,
      error,
      isFetchingNextPage,
      hasNextPage,
      isLoading,
      isRefetching,
      status,
      fetchStatus,
      feedItems: uniqueFeedItems,
      fetchPreviousPage,
      fetchNextPage,
      userSuggestions,
      trendingTopics,
    }),
    [
      isPending,
      isError,
      error,
      isFetchingNextPage,
      hasNextPage,
      isLoading,
      isRefetching,
      status,
      fetchStatus,
      uniqueFeedItems,
      fetchPreviousPage,
      fetchNextPage,
      userSuggestions,
      trendingTopics,
    ],
  );
};

export { useMixedFeedItems };
