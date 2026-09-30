import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type UseDisplayLimitArgs<T> = {
  data: readonly T[];
  batchSize: number;
  hasNextPage: boolean;
  isFetching?: boolean;
  fetchNextPage?: () => void;
};

type UseDisplayLimitReturn<T> = {
  displayedItems: readonly T[];
  handleEndReached: () => void;
  resetDisplayLimit: () => void;
};

// Slices `data` to a moving `displayLimit` window and exposes an `onEndReached`
// callback that grows the window before falling through to `fetchNextPage` for
// server pagination.
//
// Reveals all cached items in one shot (not in batchSize steps) to prevent
// onEndReached from firing in a tight loop. Incrementing by batchSize kept the
// scroll threshold active after each render, causing the list to jump repeatedly
// until displayLimit caught up with data.length.
//
// The 50 ms debounce batches rapid onEndReached re-fires (e.g. FlashList v2
// fires continuously while the list end is visible) into a single state update.
function useDisplayLimit<T>({
  data,
  batchSize,
  hasNextPage,
  isFetching,
  fetchNextPage,
}: UseDisplayLimitArgs<T>): UseDisplayLimitReturn<T> {
  const [displayLimit, setDisplayLimit] = useState(batchSize);

  const displayedItems = useMemo(
    () => data.slice(0, displayLimit),
    [data, displayLimit],
  );

  const handleEndReachedTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    return () => {
      if (handleEndReachedTimeoutRef.current) {
        clearTimeout(handleEndReachedTimeoutRef.current);
      }
    };
  }, []);

  const handleEndReached = useCallback(() => {
    if (handleEndReachedTimeoutRef.current) {
      clearTimeout(handleEndReachedTimeoutRef.current);
    }

    handleEndReachedTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        if (displayLimit < data.length) {
          setDisplayLimit(data.length);
        } else if (hasNextPage && !isFetching) {
          fetchNextPage?.();
        }
      });
    }, 50);
  }, [displayLimit, data.length, hasNextPage, isFetching, fetchNextPage]);

  const resetDisplayLimit = useCallback(() => {
    setDisplayLimit(batchSize);
  }, [batchSize]);

  return { displayedItems, handleEndReached, resetDisplayLimit };
}

export { useDisplayLimit };
