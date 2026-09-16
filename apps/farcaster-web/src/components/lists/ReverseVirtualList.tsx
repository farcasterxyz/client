import { useVirtualizer } from '@tanstack/react-virtual';
import classNames from 'classnames';
import React from 'react';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';

type ReverseVirtualListInterface = {
  scrollToIndex: ({ index }: { index: number }) => void;
  scrollToEnd: () => void;
};

type ReverseVirualListProps<T> = {
  data: T[];
  renderItem: (index: number, item: T) => React.ReactNode;
  estimateRowSize: (index: number) => number;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  virtualizerRef: React.Ref<ReverseVirtualListInterface>;
};

const ReverseVirtualList = function <T>({
  data,
  renderItem,
  estimateRowSize,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  virtualizerRef,
}: ReverseVirualListProps<T>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? data.length + 1 : data.length,
    getScrollElement: () => wrapperRef.current,
    estimateSize: estimateRowSize,
    scrollMargin: 16,
  });

  const virtualizerItems = virtualizer.getVirtualItems();

  React.useImperativeHandle(virtualizerRef, () => {
    return {
      scrollToIndex: ({ index }: { index: number }) => {
        setTimeout(() => {
          virtualizer.scrollToIndex(index, { align: 'center' });
          // This is to cover for possible issues with virtulizer not being part of the
          // render phase.
        }, 10);
      },
      scrollToEnd: () => {
        setTimeout(() => {
          virtualizer.scrollToIndex(-1, { align: 'center' });
          // This is to cover for possible issues with virtulizer not being part of the
          // render phase.
        }, 10);
      },
    } satisfies ReverseVirtualListInterface;
  });

  React.useEffect(() => {
    const [lastItem] = [...virtualizerItems].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= data.length - 10 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    data.length,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    virtualizerItems,
  ]);

  React.useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      const currentTarget = e.currentTarget as HTMLElement;

      if (currentTarget) {
        currentTarget.scrollTop -= e.deltaY;
      }
    };

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
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="scrollbar-vert mt-0.5 size-full overflow-auto scroll-auto will-change-transform"
      style={{
        transform: 'scaleY(-1)',
      }}
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
              ref={(element) => virtualizer.measureElement(element)}
              className={classNames(
                `absolute top-0 w-full will-change-transform`,
              )}
              style={{
                transform: `translateY(${start}px) scaleY(-1)`,
              }}
            >
              {isLoaderRow && hasNextPage && (
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

const MemoizedReverseVirtualList = React.memo(
  ReverseVirtualList,
) as typeof ReverseVirtualList;

export {
  MemoizedReverseVirtualList as ReverseVirtualList,
  type ReverseVirtualListInterface,
};
