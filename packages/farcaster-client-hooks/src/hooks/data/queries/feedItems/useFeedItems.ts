import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import {
  ApiCastFeedItem,
  ApiFeedSortMode,
  ApiGetFeedItems200Response,
  TypedGetNextPageParamFunction,
  TypedGetPreviousPageParamFunction,
} from 'farcaster-client-data';
import flow from 'lodash/flow';
import keyBy from 'lodash/keyBy';
import partialRight from 'lodash/partialRight';
import values from 'lodash/values';
import { useCallback, useMemo, useRef } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useInternalEventing } from '../../../../providers/InternalEventingProvider';
import { usePurged } from '../../../../providers/PurgedProvider';
import { useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import {
  buildFeedItemsFetcher,
  feedItemsDetermineNextPageParams,
  feedItemsDeterminePrevPageParams,
  FeedItemsPageParam,
} from './buildFeedItemsFetcher';
import { buildFeedItemsKey } from './buildFeedItemsKey';
import { feedItemsDefaultQueryOptions } from './feedItemsDefaultQueryOptions';
// Ensure this is enough to cover all the backend can return
const MAX_FEED_PAGES = 50;

const useFeedItems = ({
  feedKey,
  feedType,
  updateState,
  purgeToFirstPageOnMount,
  includeUserSuggestions,
  onNullFeedItemsResponse,
  sortMode,
  seedCastHash,
}: {
  feedKey: string;
  feedType: string;
  updateState: boolean;
  onNullFeedItemsResponse: () => void;
  purgeToFirstPageOnMount?: boolean;
  includeUserSuggestions?: boolean;
  sortMode?: ApiFeedSortMode;
  seedCastHash?: string;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchUpdateGloballyCachedCast = useBatchMergeIntoGloballyCachedCasts();
  const internalEventsTracker = useInternalEventing();

  const queryKey = useMemo(
    () => buildFeedItemsKey({ feedKey, feedType, sortMode: sortMode?.type }),
    [feedKey, feedType, sortMode?.type],
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
  > = useCallback((lastPage, allPages) => {
    if (nextParams.current === undefined) {
      nextParams.current = feedItemsDetermineNextPageParams(lastPage, allPages);
    }
    return nextParams.current;
  }, []);

  const getPrevPageParams: TypedGetPreviousPageParamFunction<
    ApiGetFeedItems200Response,
    FeedItemsPageParam
  > = useCallback((firstPage, allPages) => {
    if (prevParams.current === undefined) {
      prevParams.current = feedItemsDeterminePrevPageParams(
        firstPage,
        allPages,
      );
    }
    return prevParams.current;
  }, []);

  const query = useSuspenseInfiniteQuery({
    ...feedItemsDefaultQueryOptions(feedKey),
    initialPageParam: undefined,
    queryKey: queryKey,

    queryFn: buildFeedItemsFetcher({
      apiClient,
      feedKey,
      feedType,
      updateState,
      batchUpdateGloballyCachedCast,
      internalEventsTracker,
      includeUserSuggestions,
      onNullFeedItemsResponse,
      sortMode,
      seedCastHash,
    }),

    getNextPageParam: getNextPageParams,
    getPreviousPageParam: getPrevPageParams,

    // Save updateState so that users can use useSetFeedItemsAsSeenIfPrefetched to set the feed
    // as seen when the component is rendered and the feed has been prefetched but not loaded again
    meta: { updateState },
  });

  // We only limit pages when user loads a previous one as this is an easy way
  // to get an unlimited feed if you wait long enough
  // Doing it when at the bottom is not really possible because any pages we remove
  // may immediately come back from the backend and both confuse the user and mess up
  // the scroll position.
  const limitNumPages = useCallback(() => {
    const data =
      queryClient.getQueryData<InfiniteData<ApiGetFeedItems200Response>>(
        queryKey,
      );

    if (data) {
      if (data.pages.length > MAX_FEED_PAGES) {
        queryClient.setQueryData<InfiniteData<ApiGetFeedItems200Response>>(
          queryKey,
          (currentData) => {
            if (!currentData) {
              return currentData;
            }

            // First remove empty pages after the first
            const newParams: unknown[] = [currentData.pageParams[0]];
            const newPages: ApiGetFeedItems200Response[] = [
              currentData.pages[0],
            ];
            for (let i = 1; i < currentData.pages.length; i++) {
              const page = currentData.pages[i];
              if (page === null) {
                // eslint-disable-next-line no-console
                console.warn('page was null: useFeedItems.limitNumPages');
              }

              if (page.result.items.length > 0) {
                newParams.push(currentData.pageParams[i]);
                newPages.push(page);
              }
            }

            // Then limit to the maximum
            return {
              pageParams: newParams.slice(0, MAX_FEED_PAGES),
              pages: newPages.slice(0, MAX_FEED_PAGES),
            };
          },
        );
      }
    }
  }, [queryClient, queryKey]);

  // Override fetchPreviousPage because we need some extra functionality
  const fetchPreviousPage = useCallback(async () => {
    // Cancel any existing query because we had race conditions where fetchNextPage would run
    // and the two would mess up each other's results (see more below)
    await queryClient.cancelQueries({
      queryKey: queryKey,
    });

    const result = await query.fetchPreviousPage();

    // Clear cached params
    prevParams.current = undefined;
    nextParams.current = undefined;

    // Replace the feed entirely with the response we just got if the backend requested it
    if (result.data?.pages[0]?.result.replaceFeed) {
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

    limitNumPages();
  }, [limitNumPages, query, queryClient, queryKey]);

  // Override fetchNextPage because we need some extra functionality
  const fetchNextPage = useCallback(async () => {
    const result = await query.fetchNextPage();

    // Clear cached params
    prevParams.current = undefined;
    nextParams.current = undefined;

    // We are subject to race conditions where by the time a next page is fetched, the first
    // page could have changed. If the result from this query is empty, it indicates the end of
    // the feed and users won't be able to scroll down further. This is especially bad when the feed
    // was cleared. To avoid this, we discard this page if it's empty and the olderThan we used
    // no longer matches the latestMainCastTimestamp of the first page
    const pages = result.data?.pages;
    const pageParams = result.data?.pageParams;
    if (pages && pageParams) {
      if (pages.length > 1) {
        const lastPageIndex = pages.length - 1;
        const lastPage = pages[lastPageIndex];
        if (lastPage === null) {
          // eslint-disable-next-line no-console
          console.warn('lastPage was null: useFeedItems.fetchNextPage');
        }

        if (lastPage.result.items.length === 0) {
          // Page we just pulled is empty
          const requestOlderThan = (pageParams as FeedItemsPageParam[])[
            lastPageIndex
          ].olderThan;

          const firstPage = pages[0];
          if (firstPage === null) {
            // eslint-disable-next-line no-console
            console.warn('firstPage was null: useFeedItems.fetchNextPage');
          }

          const firstPageLatestMainCastTimestamp =
            firstPage.result.latestMainCastTimestamp;
          if (
            requestOlderThan &&
            firstPageLatestMainCastTimestamp &&
            requestOlderThan !== firstPageLatestMainCastTimestamp
          ) {
            // We used a different olderThan in our request than what the first page has
            // now -> remove this page
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

            // nextParams was already cleared above so getNextPageParams will
            // recalculate using the refreshed page 1 timestamp. Without this
            // retry the feed gets permanently stuck: the removed page had 0
            // items so displayData.length is unchanged, the FlatList's
            // dataSizeForLastOnEndReachedRef guard never resets, and
            // onEndReached cannot fire again even though hasNextPage is true.
            await fetchNextPage();
          }
        }
      }
    }
  }, [query, queryClient, queryKey]);

  const onEndReached = useOnEndReached({
    ...query,
    // @ts-expect-error - we improved typing on useOnEndReached and our customized fetchNextpage fn doesn't typecheck, it was already working so leave it
    fetchNextPage,
  });

  return useMemo(() => {
    const { data, ...rest } = query;

    // Flatten and deduplicate (keeping last) so users don't have to do it themselves all the time
    const flatItems =
      data?.pages.flatMap((page) => {
        if (page === null) {
          // eslint-disable-next-line no-console
          console.warn('page was null: useFeedItems.deduplicate');
        }

        return page.result.items;
      }) || [];

    const uniqFeedItems = lastUniqBy('id')(flatItems) as ApiCastFeedItem[];
    const userSuggestions =
      data?.pages.flatMap((page) => page.result.suggestedUsers || []) || [];

    return {
      ...rest,
      feedItems: uniqFeedItems,
      fetchPreviousPage,
      fetchNextPage,
      onEndReached,
      userSuggestions,
    };
  }, [fetchNextPage, fetchPreviousPage, query, onEndReached]);
};

const useNonSuspenseFeedItems = ({
  feedKey,
  feedType,
  updateState,
  purgeToFirstPageOnMount,
  includeUserSuggestions,
  onNullFeedItemsResponse,
  sortMode,
  seedCastHash,
}: {
  feedKey: string;
  feedType: string;
  updateState: boolean;
  onNullFeedItemsResponse: () => void;
  purgeToFirstPageOnMount?: boolean;
  includeUserSuggestions?: boolean;
  sortMode?: ApiFeedSortMode;
  seedCastHash?: string;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchUpdateGloballyCachedCast = useBatchMergeIntoGloballyCachedCasts();
  const internalEventsTracker = useInternalEventing();

  const queryKey = useMemo(
    () => buildFeedItemsKey({ feedKey, feedType, sortMode: sortMode?.type }),
    [feedKey, feedType, sortMode?.type],
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
  > = useCallback((lastPage, allPages) => {
    if (nextParams.current === undefined) {
      nextParams.current = feedItemsDetermineNextPageParams(lastPage, allPages);
    }
    return nextParams.current;
  }, []);

  const getPrevPageParams: TypedGetPreviousPageParamFunction<
    ApiGetFeedItems200Response,
    FeedItemsPageParam
  > = useCallback((firstPage, allPages) => {
    if (prevParams.current === undefined) {
      prevParams.current = feedItemsDeterminePrevPageParams(
        firstPage,
        allPages,
      );
    }
    return prevParams.current;
  }, []);

  const query = useInfiniteQuery({
    ...feedItemsDefaultQueryOptions(feedKey),
    initialPageParam: undefined,
    queryKey: queryKey,

    queryFn: buildFeedItemsFetcher({
      apiClient,
      feedKey,
      feedType,
      updateState,
      batchUpdateGloballyCachedCast,
      internalEventsTracker,
      includeUserSuggestions,
      onNullFeedItemsResponse,
      sortMode,
      seedCastHash,
    }),

    getNextPageParam: getNextPageParams,
    getPreviousPageParam: getPrevPageParams,

    // Save updateState so that users can use useSetFeedItemsAsSeenIfPrefetched to set the feed
    // as seen when the component is rendered and the feed has been prefetched but not loaded again
    meta: { updateState },
  });

  // We only limit pages when user loads a previous one as this is an easy way
  // to get an unlimited feed if you wait long enough
  // Doing it when at the bottom is not really possible because any pages we remove
  // may immediately come back from the backend and both confuse the user and mess up
  // the scroll position.
  const limitNumPages = useCallback(() => {
    const data =
      queryClient.getQueryData<InfiniteData<ApiGetFeedItems200Response>>(
        queryKey,
      );

    if (data) {
      if (data.pages.length > MAX_FEED_PAGES) {
        queryClient.setQueryData<InfiniteData<ApiGetFeedItems200Response>>(
          queryKey,
          (currentData) => {
            if (!currentData) {
              return currentData;
            }

            // First remove empty pages after the first
            const newParams: unknown[] = [currentData.pageParams[0]];
            const newPages: ApiGetFeedItems200Response[] = [
              currentData.pages[0],
            ];
            for (let i = 1; i < currentData.pages.length; i++) {
              const page = currentData.pages[i];
              if (page === null) {
                // eslint-disable-next-line no-console
                console.warn('page was null: useFeedItems.limitNumPages');
              }

              if (page.result.items.length > 0) {
                newParams.push(currentData.pageParams[i]);
                newPages.push(page);
              }
            }

            // Then limit to the maximum
            return {
              pageParams: newParams.slice(0, MAX_FEED_PAGES),
              pages: newPages.slice(0, MAX_FEED_PAGES),
            };
          },
        );
      }
    }
  }, [queryClient, queryKey]);

  // Override fetchPreviousPage because we need some extra functionality
  const fetchPreviousPage = useCallback(async () => {
    // Cancel any existing query because we had race conditions where fetchNextPage would run
    // and the two would mess up each other's results (see more below)
    await queryClient.cancelQueries({
      queryKey: queryKey,
    });

    const result = await query.fetchPreviousPage();

    // Clear cached params
    prevParams.current = undefined;
    nextParams.current = undefined;

    // Replace the feed entirely with the response we just got if the backend requested it
    if (result.data?.pages[0]?.result.replaceFeed) {
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

    limitNumPages();
  }, [limitNumPages, query, queryClient, queryKey]);

  // Override fetchNextPage because we need some extra functionality
  const fetchNextPage = useCallback(async () => {
    const result = await query.fetchNextPage();

    // Clear cached params
    prevParams.current = undefined;
    nextParams.current = undefined;

    // We are subject to race conditions where by the time a next page is fetched, the first
    // page could have changed. If the result from this query is empty, it indicates the end of
    // the feed and users won't be able to scroll down further. This is especially bad when the feed
    // was cleared. To avoid this, we discard this page if it's empty and the olderThan we used
    // no longer matches the latestMainCastTimestamp of the first page
    const pages = result.data?.pages;
    const pageParams = result.data?.pageParams;
    if (pages && pageParams) {
      if (pages.length > 1) {
        const lastPageIndex = pages.length - 1;
        const lastPage = pages[lastPageIndex];
        if (lastPage === null) {
          // eslint-disable-next-line no-console
          console.warn('lastPage was null: useFeedItems.fetchNextPage');
        }

        if (lastPage.result.items.length === 0) {
          // Page we just pulled is empty
          const requestOlderThan = (pageParams as FeedItemsPageParam[])[
            lastPageIndex
          ].olderThan;

          const firstPage = pages[0];
          if (firstPage === null) {
            // eslint-disable-next-line no-console
            console.warn('firstPage was null: useFeedItems.fetchNextPage');
          }

          const firstPageLatestMainCastTimestamp =
            firstPage.result.latestMainCastTimestamp;
          if (
            requestOlderThan &&
            firstPageLatestMainCastTimestamp &&
            requestOlderThan !== firstPageLatestMainCastTimestamp
          ) {
            // We used a different olderThan in our request than what the first page has
            // now -> remove this page
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

            // nextParams was already cleared above so getNextPageParams will
            // recalculate using the refreshed page 1 timestamp. Without this
            // retry the feed gets permanently stuck: the removed page had 0
            // items so displayData.length is unchanged, the FlatList's
            // dataSizeForLastOnEndReachedRef guard never resets, and
            // onEndReached cannot fire again even though hasNextPage is true.
            await fetchNextPage();
          }
        }
      }
    }
  }, [query, queryClient, queryKey]);

  const onEndReached = useOnEndReached({
    ...query,
    // @ts-expect-error - we improved typing on useOnEndReached and our customized fetchNextpage fn doesn't typecheck, it was already working so leave it
    fetchNextPage,
  });

  return useMemo(() => {
    const { data, ...rest } = query;

    // Flatten and deduplicate (keeping last) so users don't have to do it themselves all the time
    const flatItems =
      data?.pages.flatMap((page) => {
        if (page === null) {
          // eslint-disable-next-line no-console
          console.warn('page was null: useFeedItems.deduplicate');
        }

        return page.result.items;
      }) || [];

    const uniqFeedItems = lastUniqBy('id')(flatItems) as ApiCastFeedItem[];
    const userSuggestions =
      data?.pages.flatMap((page) => page.result.suggestedUsers || []) || [];

    return {
      ...rest,
      feedItems: uniqFeedItems,
      fetchPreviousPage,
      fetchNextPage,
      onEndReached,
      userSuggestions,
    };
  }, [fetchNextPage, fetchPreviousPage, query, onEndReached]);
};

// Dedup but keep the last item, from
// https://stackoverflow.com/questions/56361944/lodash-uniqwith-how-say-lodash-keep-last-duplicate
// Takes the `key` to unique by, and returns a function that passes its argument (the `array`)
// first through `keyBy` (where `key` is already set as 2nd argument), which returns an object
// keyed by the extracted key, with values being the last seen value in the `array`, and then passes
// that object through `values` to get only the values
const lastUniqBy = (key: string) => flow(partialRight(keyBy, key), values);

export { useFeedItems, useNonSuspenseFeedItems };
