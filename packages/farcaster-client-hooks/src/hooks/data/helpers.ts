import {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryFunction,
  QueryKey,
  UseInfiniteQueryResult,
  useQueryClient,
  useSuspenseInfiniteQuery,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
} from '@tanstack/react-query';
import lodashUniqBy from 'lodash/uniqBy';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePurged } from '../../providers/PurgedProvider';
import {
  defaultRecentlyPrefetchedThreshold,
  wasQueryDataRecentlyFetched,
} from '../../utils/PrefetchAndRefreshUtils';

const delayBeforeInvalidation = 250;

type StrictlyTypedFetcher<T> = (context: {
  pageParam: string | undefined;
}) => Promise<T>;

type LooselyTypedFetcher<T> = () => Promise<T>;

/**
 * Helper function to standardize fetchers inteded to be used with React Query's `useSuspenseInfiniteQuery`.
 * This helper will surround the given fetcher in a thin wrapper, which passes through
 * any arguments to the given query function. While the given query function is
 * expected to have strict typing for `pageParam`, the returned function will have
 * more relaxed typing (`pageParam` will be `any`), because unfortunately this seems
 * to be the only way to get the types to play nicely with React Query.
 * @param queryFunction - Data-fetching function intended to be used with React Query.
 * @returns The wrapped fetcher.
 */
const wrapPaginatedFetcher =
  <T>(queryFunction: StrictlyTypedFetcher<T>): LooselyTypedFetcher<T> =>
  (...args) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (queryFunction as any)(...args);
  };

const useQueryWithRefreshOnMount = <T>({
  initialValue,
  invalidate,
  queryKey,
}: {
  initialValue: T;
  invalidate: () => void;
  queryKey: QueryKey;
}) => {
  const queryClient = useQueryClient();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      const state = queryClient.getQueryState(queryKey);
      const wasRecentlyFetched = wasQueryDataRecentlyFetched({ state });

      if (!wasRecentlyFetched) {
        setTimeout(() => {
          invalidate();
        }, delayBeforeInvalidation);
      }
    }
  }, [queryClient, queryKey, invalidate]);

  return initialValue;
};

const useQueryWithRefreshOnFocus = <T>({
  initialValue,
  invalidate,
  isFocused,
  queryKey,
}: {
  initialValue: T;
  invalidate: () => Promise<void>;
  isFocused: boolean;
  queryKey: QueryKey;
}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isFocused) {
      const state = queryClient.getQueryState(queryKey);
      const wasRecentlyFetched = wasQueryDataRecentlyFetched({ state });

      if (!wasRecentlyFetched) {
        setTimeout(async () => {
          await invalidate();
        }, delayBeforeInvalidation);
      }
    }
  }, [queryClient, queryKey, invalidate, isFocused]);

  return initialValue;
};

const useCheckIfRecentlyPrefetched = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ queryKey }: { queryKey: unknown[] }) => {
      const state = queryClient.getQueryState(queryKey);
      return wasQueryDataRecentlyFetched({
        state,
        threshold: defaultRecentlyPrefetchedThreshold,
      });
    },
    [queryClient],
  );
};

// Used in web client to avoid content flashing, especially for PWA rendered mode.
// useQueryWithRefreshOnMount resets the data in an effect which causes a potential flash
// as on the first pass useSuspenseInfiniteQuery() is called and data is returned, and then in the
// second pass the effect is run and the data is invalidated.
// This hook does the data reset in-line, before calling useSuspenseInfiniteQuery(), ensuring no second
// pass.
const usePurgedInfiniteQuery = <
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey, unknown>,
  options: Omit<
    UseSuspenseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      InfiniteData<TData>,
      TQueryFnData,
      TQueryKey
    >,
    'queryKey' | 'queryFn'
  >,
  purgeOnMount: boolean = true,
): UseSuspenseInfiniteQueryResult<InfiniteData<TData>, TError> => {
  const queryClient = useQueryClient();

  // We need to rely on context here, because if the component suspends, its references will be lost
  const { checkIfRecentlyPurged, markAsPurged } = usePurged();

  // We also want to keep a flag to know if the component has successfully rendered, because state changes (e.g. loading a new page of data for an infinitely scrollable view) will cause re-renders. We only want to purge data on the initial render.
  const hasRenderedRef = useRef(false);

  if (
    purgeOnMount &&
    !hasRenderedRef.current &&
    !checkIfRecentlyPurged({ queryKey })
  ) {
    markAsPurged({ queryKey });

    // Capture invalidation state before setQueryData resets it.
    // TanStack Query's setQueryData unconditionally sets isInvalidated → false
    // and updates dataUpdatedAt → Date.now(), which would make the data appear
    // fresh to useSuspenseInfiniteQuery and suppress the background refetch.
    const wasInvalidated =
      queryClient.getQueryState(queryKey)?.isInvalidated ?? false;

    const defaults = queryClient.getQueryDefaults(queryKey);

    queryClient.setQueryDefaults(queryKey, {
      structuralSharing: false,
    });

    queryClient.setQueryData<InfiniteData<unknown> | null>(
      queryKey,
      (prevData) => {
        if (!prevData) {
          return prevData;
        }

        if (!prevData.pages) {
          return null;
        }

        return {
          ...prevData,
          pages: [prevData.pages[0]],
          pageParams: [prevData.pageParams[0]],
        };
      },
    );

    queryClient.setQueryDefaults(queryKey, defaults);

    // Restore the invalidation flag so useSuspenseInfiniteQuery triggers a
    // background refetch. refetchType: 'none' marks it stale without firing a
    // network request here — the fetch is initiated by useSuspenseInfiniteQuery below.
    if (wasInvalidated) {
      queryClient.invalidateQueries({
        queryKey,
        refetchType: 'none',
      });
    }
  }

  hasRenderedRef.current = true;

  return useSuspenseInfiniteQuery({ queryKey, queryFn, ...options });
};

const useRefreshInfiniteFirstPageOnly = <T>(
  queryKey: QueryKey,
  refetch: () => Promise<unknown>,
) => {
  const queryClient = useQueryClient();

  const purgeAndRefetch = useCallback(async () => {
    const defaults = queryClient.getQueryDefaults(queryKey);

    queryClient.setQueryDefaults(queryKey, {
      structuralSharing: false,
    });

    // Before calling the `refetch` function, we want to remove all
    // but the first page of data in the cache. If we do not do this,
    // react query will try to refetch every page that the user has already loaded.
    // If there is only one page in the cache, react query will fetch the initial page,
    // then only (re)fetch subsequent pages as the user scrolls down.
    queryClient.setQueryData<InfiniteData<T>>(queryKey, (data) => {
      if (!data) {
        return data;
      }

      const nextData = {
        pageParams: data.pageParams.slice(0, 1),
        pages: data.pages.slice(0, 1),
      };

      return nextData;
    });

    queryClient.setQueryDefaults(queryKey, defaults);

    return refetch();
    // We're accounting for `queryKey` in the dependency array, but incorporating it as a string,
    // so the callback remains stable if the underlying query key doesn't change - even if the reference itself does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, queryKey.join('|'), refetch]);

  return purgeAndRefetch;
};

// Hook that calls the refetch function if an element becomes focused while it is at the top (for some definition of top
// provided by the caller)
const useRefreshOnFocusWhenCondition = ({
  queryKey,
  refetch,
  isFocused,
  condition,
}: {
  queryKey: QueryKey;
  refetch: () => Promise<unknown>;
  isFocused: boolean;
  condition: boolean;
}) => {
  const queryClient = useQueryClient();
  const prevIsFocusedRef = useRef(isFocused);

  useEffect(() => {
    if (!prevIsFocusedRef.current && isFocused && condition) {
      // We just became focused and are on top -> refetch if not refetched in the last minute
      const state = queryClient.getQueryState(queryKey);
      const wasRecentlyFetched = wasQueryDataRecentlyFetched({
        state,
        threshold: 60 * 1000,
      });

      if (!wasRecentlyFetched) {
        setTimeout(async () => {
          await refetch();
        }, delayBeforeInvalidation);
      }
    }

    prevIsFocusedRef.current = isFocused;
  }, [queryClient, queryKey, isFocused, condition, refetch]);
};

const useWasEverTrue = (value: boolean) => {
  const [everTrue, setEverTrue] = useState(value);

  useEffect(() => {
    if (value && !everTrue) {
      setEverTrue(true);
    }
  }, [everTrue, value]);

  return everTrue;
};

function useInterval(fn: (() => void) | undefined, everyMsec: number) {
  useEffect(() => {
    if (fn) {
      const id = setInterval(() => {
        fn();
      }, everyMsec);

      return () => clearInterval(id);
    }
  }, [everyMsec, fn]);
}

export function useFlatPaginatedResults<TKey extends string, TData>({
  data,
  key,
}: {
  data: InfiniteData<{ result: { [key in TKey]: TData[] } }> | undefined;
  key: TKey;
}): TData[] | undefined {
  return useMemo(() => {
    // data being undefined means we haven't fetched anything
    // data.pages being empty is the placeholder value. If there are no results, we'd still have a
    // a page, but with no casts in it.
    if (!data || data.pages.length === 0) {
      return undefined;
    } else {
      return data.pages.flatMap((page) => page.result[key]);
    }
  }, [data, key]);
}

export type PaginatedResult<TItem> = {
  items: TItem[];
  next?: { cursor?: string | undefined } | undefined;
};

export type InfinitePaginatedData<TItem> = InfiniteData<PaginatedResult<TItem>>;

export type PaginatedResultFetcher<TItem> = (options: {
  pageParam?: string;
}) => Promise<PaginatedResult<TItem>>;

export function selectFlatStandardizedPaginatedResults<TItem>(
  data: InfiniteData<PaginatedResult<TItem>, string | undefined>,
): TItem[] {
  // data undefined indicates we haven't fetched any data yet
  if (data.pages.length === 0) {
    return [];
  } else {
    return data.pages.flatMap((page) => page.items);
  }
}

export function buildSelectFlatStandardizedPaginatedResults<TItem>({
  uniqBy,
}: Partial<{ uniqBy: (item: TItem) => string }>): (
  data: InfiniteData<PaginatedResult<TItem>, string | undefined>,
) => TItem[] {
  return (data) => {
    const flatData = selectFlatStandardizedPaginatedResults(data);
    return uniqBy ? lodashUniqBy(flatData, uniqBy) : flatData;
  };
}

export function useFlatStandardizedPaginatedResults<TItem>({
  data,
  uniqBy,
}: {
  data: InfiniteData<PaginatedResult<TItem>> | undefined;
  // must be stable
  uniqBy?: (item: TItem) => string;
}): TItem[] | undefined {
  return useMemo(() => {
    // data undefined indicates we haven't fetched any data yet
    if (!data || data.pages.length === 0) {
      return undefined;
    } else {
      const flatData = data.pages.flatMap((page) => page.items);
      return uniqBy ? lodashUniqBy(flatData, uniqBy) : flatData;
    }
  }, [data, uniqBy]);
}

/**
 * Removes the item from all matching query caches and returns the
 * last removed value if there was one.
 */
export const removeItemFromPaginatedResultCaches = <TItem>({
  queryClient,
  queryKey,
  keyExtractor,
  removeKey,
}: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  keyExtractor: (item: TItem) => string;
  removeKey: string;
}) => {
  let removed: TItem | undefined = undefined;
  queryClient.setQueriesData<InfinitePaginatedData<TItem>>(
    { queryKey },
    (data) => {
      if (!data) {
        return;
      }

      const nextPages = data.pages.map((page) => ({
        next: page.next,
        items: page.items.filter((item) => {
          if (keyExtractor(item) !== removeKey) {
            removed = item;
            return true;
          } else {
            return false;
          }
        }),
      }));

      return {
        pages: nextPages,
        pageParams: data?.pageParams ?? [],
      };
    },
  );

  return removed;
};

/**
 * Updates an item from all matching query caches
 */
export const updateItemInPaginatedResultCaches = <TItem>({
  queryClient,
  queryKey,
  keyExtractor,
  updateKey,
  update,
}: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  keyExtractor: (item: TItem) => string;
  updateKey: string;
  update: (item: TItem) => TItem;
}) => {
  queryClient.setQueriesData<InfinitePaginatedData<TItem>>(
    { queryKey },
    (data) => {
      if (!data) {
        return;
      }

      return updateItemInPaginatedCache({
        data,
        keyExtractor,
        updateKey,
        update,
      });
    },
  );
};

export const updateItemInQueryKeys = <TItem extends object>({
  queryClient,
  queryKeys,
  keyExtractor,
  updateKey,
  update,
}: {
  queryClient: QueryClient;
  queryKeys: QueryKey[];
  keyExtractor: (item: TItem) => string;
  updateKey: string;
  update: (item: TItem) => TItem;
}) => {
  for (const queryKey of queryKeys) {
    updateItemInQueryKey({
      queryClient,
      queryKey,
      keyExtractor,
      updateKey,
      update,
    });
  }
};

export const updateItemInQueryKey = <TItem extends object>({
  queryClient,
  queryKey,
  keyExtractor,
  updateKey,
  update,
}: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  keyExtractor: (item: TItem) => string;
  updateKey: string;
  update: (item: TItem) => TItem;
}) => {
  queryClient.setQueriesData<InfinitePaginatedData<TItem> | TItem>(
    { queryKey },
    (data) => {
      if (!data) {
        return;
      }

      try {
        if ('pages' in data) {
          return updateItemInPaginatedCache({
            data,
            keyExtractor,
            updateKey,
            update,
          });
        } else if (keyExtractor(data) === updateKey) {
          return update(data);
        }
      } catch (e: unknown) {
        return data;
      }
    },
  );
};

const updateItemInPaginatedCache = <TItem>({
  data,
  keyExtractor,
  updateKey,
  update,
}: {
  data: InfinitePaginatedData<TItem>;
  keyExtractor: (item: TItem) => string;
  updateKey: string;
  update: (item: TItem) => TItem;
}) => {
  const nextPages = data.pages.map((page) => ({
    next: page.next,
    items: page.items.map((item) => {
      if (keyExtractor(item) === updateKey) {
        return update(item);
      } else {
        return item;
      }
    }),
  }));

  return {
    pages: nextPages,
    pageParams: data?.pageParams ?? [],
  };
};

/**
 * Hook that creates a safe onEndReached handler for infinite queries.
 * This prevents fetchNextPage from cancelling ongoing refetch operations.
 *
 * @param result - The result object from useInfiniteQuery or useSuspenseInfiniteQuery
 * @returns A callback that can be passed to onEndReached
 */
function useOnEndReached<TData = unknown, TError = DefaultError>(
  result:
    | UseInfiniteQueryResult<TData, TError>
    | UseSuspenseInfiniteQueryResult<TData, TError>,
) {
  const { fetchNextPage, hasNextPage, isFetching, data } = result;

  // Track if we wanted to fetch next page while a refetch was in progress
  const pendingFetchNext = useRef(false);

  // Handle deferred fetchNextPage after refetch completes
  useEffect(() => {
    if (!pendingFetchNext.current || isFetching) {
      return;
    }

    pendingFetchNext.current = false;
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [isFetching, hasNextPage, fetchNextPage]);

  return useCallback(() => {
    // If data is undefined we haven't loaded any data yet, no-op if the list reaches the end
    if (data === undefined) {
      return;
    }

    if (hasNextPage && !isFetching) {
      fetchNextPage();
    } else if (isFetching) {
      // Mark that we want to fetch next page once current fetch completes
      pendingFetchNext.current = true;
    }
  }, [data, isFetching, hasNextPage, fetchNextPage]);
}

/**
 * Creates a proxy wrapper that extends a React Query result with additional properties
 * while preserving React Query's property tracking optimization.
 *
 * This prevents the need to spread the result object which would break React Query's
 * optimization that only triggers re-renders when accessed properties change.
 *
 * @param result - The base React Query result object
 * @param extensions - Additional properties to add to the result
 * @returns A proxy that combines both the original result and extensions
 */
function extendResult<
  TResult extends object,
  TExtensions extends Record<string, unknown>,
>(result: TResult, extensions: TExtensions): TResult & TExtensions {
  type Combined = TResult & TExtensions;
  const wrapper = extensions as Combined;

  return new Proxy(wrapper, {
    get(_target, prop) {
      if (prop in extensions) {
        return extensions[prop as keyof TExtensions];
      }
      return (result as TResult)[prop as keyof TResult];
    },
  }) as Combined;
}

export {
  extendResult,
  useCheckIfRecentlyPrefetched,
  useInterval,
  useOnEndReached,
  usePurgedInfiniteQuery,
  useQueryWithRefreshOnFocus,
  useQueryWithRefreshOnMount,
  useRefreshInfiniteFirstPageOnly,
  useRefreshOnFocusWhenCondition,
  useWasEverTrue,
  wrapPaginatedFetcher,
};
