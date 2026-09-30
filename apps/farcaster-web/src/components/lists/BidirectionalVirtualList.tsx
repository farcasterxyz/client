import { useVirtualizer } from '@tanstack/react-virtual';
import React from 'react';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';

export type BidirectionalVirtualListInterface = {
  scrollToIndex: ({
    index,
    animated,
  }: {
    index: number;
    animated: boolean;
  }) => void;
  scrollToEnd: ({ animated }: { animated: boolean }) => void;
  scrollToEndIfAlreadyNearEnd: () => void;
  keepScrollPosition: ({ buffer }: { buffer: number }) => void;
};

type BidirectionalVirtualListProps<T> = {
  data: T[];
  extractKey: (index: number, item: T) => string;
  renderItem: (index: number, item: T) => React.ReactNode;
  estimateRowSize: (index: number) => number;
  parentReadyToLoadNewContent: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
  virtualizerRef: React.Ref<BidirectionalVirtualListInterface>;
  onScroll: React.UIEventHandler<HTMLDivElement>;
  scrollLocked: boolean;
};

const BidirectionalVirtualList = function <T>({
  data,
  extractKey: _,
  renderItem,
  estimateRowSize,
  hasNextPage,
  hasPreviousPage,
  fetchNextPage,
  fetchPreviousPage,
  parentReadyToLoadNewContent,
  virtualizerRef,
  onScroll,
  scrollLocked,
}: BidirectionalVirtualListProps<T>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const indexBeforeFetchRef = React.useRef<number | undefined>(undefined);

  const scrollTopRef = React.useRef<number>(0);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => wrapperRef.current,
    estimateSize: estimateRowSize,
    scrollMargin: 16,
  });

  const virtualizerItems = virtualizer.getVirtualItems();

  React.useImperativeHandle(virtualizerRef, () => {
    return {
      scrollToIndex: ({
        index,
        animated,
      }: {
        index: number;
        animated: boolean;
      }) => {
        if (virtualizerItems.length !== 0) {
          setTimeout(() => {
            virtualizer.scrollToIndex(index, {
              align: 'center',
              behavior: animated ? 'smooth' : 'auto',
            });
            // This is to cover for possible issues with virtulizer not being part of the
            // render phase.
          }, 10);
        }
      },
      scrollToEnd: ({ animated }) => {
        if (virtualizerItems.length !== 0) {
          setTimeout(() => {
            virtualizer.scrollToIndex(-1, {
              align: 'center',
              behavior: animated ? 'smooth' : 'auto',
            });
            // This is to cover for possible issues with virtulizer not being part of the
            // render phase.
          }, 10);
        }
      },
      scrollToEndIfAlreadyNearEnd: () => {
        if (
          virtualizerItems.length !== 0 &&
          typeof wrapperRef.current !== 'undefined' &&
          wrapperRef.current !== null
        ) {
          if (wrapperRef.current.scrollTop <= 75) {
            setTimeout(() => {
              virtualizer.scrollToIndex(-1, { align: 'center' });
              // This is to cover for possible issues with virtulizer not being part of the
              // render phase.
            }, 10);
          }
        }
      },
      keepScrollPosition: ({ buffer }: { buffer: number }) => {
        // To avoid first render buffer incremenets. If no scroll occurred we don't
        // want to move anywhere.
        if (
          hasScrolledRef.current &&
          typeof indexBeforeFetchRef.current !== 'undefined'
        ) {
          setTimeout(() => {
            virtualizer.scrollToIndex(buffer, { align: 'center' });
            // This is to cover for possible issues with virtulizer not being part of the
            // render phase.
          }, 10);
        }
      },
    } satisfies BidirectionalVirtualListInterface;
  });

  const hasScrolledRef = React.useRef<boolean>(false);

  React.useLayoutEffect(() => {
    const copiedVirtualizedItems = [...virtualizerItems];
    const [firstItem] = copiedVirtualizedItems;
    const [lastItem] = copiedVirtualizedItems.reverse();

    if (
      !lastItem ||
      !firstItem ||
      typeof wrapperRef.current === 'undefined' ||
      wrapperRef.current === null
    ) {
      return;
    }

    const currentScrollTop = wrapperRef.current.scrollTop;
    const shouldAttemptToFetchNextPage =
      currentScrollTop !== 0 && currentScrollTop >= scrollTopRef.current;
    scrollTopRef.current = currentScrollTop;

    const shouldFetchNextPage =
      hasScrolledRef.current &&
      hasNextPage &&
      lastItem.index >= data.length - 2 &&
      shouldAttemptToFetchNextPage;

    const shouldFetchPreviousPage =
      hasScrolledRef.current &&
      hasPreviousPage &&
      (firstItem.index === 0 ||
        (firstItem.index > 2 && firstItem.index <= 5)) &&
      !shouldFetchNextPage;

    if (shouldFetchNextPage) {
      fetchNextPage();

      scrollTopRef.current = currentScrollTop;

      return;
    }

    if (shouldFetchPreviousPage) {
      indexBeforeFetchRef.current = firstItem.index;

      fetchPreviousPage();

      scrollTopRef.current = currentScrollTop;

      return;
    }
  }, [
    data.length,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    parentReadyToLoadNewContent,
    virtualizerItems,
  ]);

  const handleScroll = React.useCallback(
    (e: WheelEvent) => {
      if (scrollLocked) {
        return;
      }

      e.preventDefault();

      if (!hasScrolledRef.current) {
        hasScrolledRef.current = true;
      }

      const currentTarget = e.currentTarget as HTMLElement;

      if (currentTarget) {
        currentTarget.scrollTop -= e.deltaY;
      }
    },
    [scrollLocked],
  );

  React.useEffect(() => {
    const wrapperRefCurrent = wrapperRef.current;

    if (
      typeof wrapperRefCurrent !== 'undefined' &&
      wrapperRefCurrent !== null
    ) {
      wrapperRefCurrent.addEventListener('wheel', handleScroll, {
        passive: false,
      });
    }

    return () => {
      if (
        typeof wrapperRefCurrent !== 'undefined' &&
        wrapperRefCurrent !== null
      ) {
        wrapperRefCurrent.removeEventListener('wheel', handleScroll);
      }
    };
  }, [handleScroll]);

  return (
    <div
      ref={wrapperRef}
      className="scrollbar-vert size-full overflow-auto scroll-auto"
      style={{
        transform: 'scaleY(-1)',
      }}
      onScroll={onScroll}
    >
      <div
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map(({ index, start }) => {
          const isLoaderRow = index > data.length - 1;
          const item = data[index];

          return (
            <div
              key={index}
              data-index={index}
              ref={virtualizer.measureElement}
              className="absolute top-0 w-full"
              style={{
                transform: `translateY(${start}px) scaleY(-1)`,
              }}
            >
              {isLoaderRow && (
                <div className="flex w-full flex-row justify-center py-1">
                  <LoadingIndicator />
                </div>
              )}
              {!isLoaderRow && renderItem(index, item)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MemoizedBidirectionalVirtualList = React.memo(
  BidirectionalVirtualList,
) as typeof BidirectionalVirtualList;

export { MemoizedBidirectionalVirtualList as BidirectionalVirtualList };
