import React, {
  memo,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useInView } from 'react-intersection-observer';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';

type FlatListProps<T, TExtra> = {
  containerClassName?: string;
  data: T[] | undefined;
  emptyView: ReactElement;
  isFetchingNextPage?: boolean;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: (() => void) | (() => Promise<void>);
  onEndReachedThreshold?: number;
  renderItem: (params: {
    index: number;
    item: T;
    extra?: TExtra;
  }) => ReactElement;
  itemClassName?: string;
  onManualScroll?: () => void;
  extraProps?: TExtra;
};

const FlatList = function <T, TExtra = undefined>({
  data,
  emptyView,
  isFetchingNextPage,
  keyExtractor,
  extraProps,
  onEndReached,
  onEndReachedThreshold = 0.35,
  containerClassName,
  itemClassName,
  renderItem,
  onManualScroll,
}: FlatListProps<T, TExtra>) {
  const dataSizeForLastOnEndReachedRef = useRef<number>(undefined);
  const reverseLoadingRef = useRef<HTMLDivElement>(null);

  const displayData = useMemo(() => {
    return data || [];
  }, [data]);

  const inViewThresholdIndex = useMemo(() => {
    if (!displayData) {
      return Number.POSITIVE_INFINITY;
    }

    const ti = Math.floor(
      (displayData.length - 1) * (1 - onEndReachedThreshold),
    );

    return ti;
  }, [displayData, onEndReachedThreshold]);

  const onItemInView = useCallback(
    async (index: number) => {
      if (
        !isFetchingNextPage &&
        onEndReached &&
        dataSizeForLastOnEndReachedRef.current !== displayData.length &&
        index >= inViewThresholdIndex
      ) {
        dataSizeForLastOnEndReachedRef.current = displayData.length;
        onEndReached();
        reverseLoadingRef.current?.scrollIntoView({ block: 'end' });
      }
    },
    [
      displayData.length,
      inViewThresholdIndex,
      isFetchingNextPage,
      onEndReached,
    ],
  );

  if (displayData.length === 0 && !isFetchingNextPage) {
    return emptyView;
  }

  return (
    <div
      className={`${containerClassName || ''} fade-in`}
      onWheel={() => {
        onManualScroll?.();
      }}
    >
      {displayData.map((item, index) => {
        return (
          <React.Fragment key={keyExtractor(item, index)}>
            <MemoizedFlatListItem
              key={keyExtractor(item, index)}
              extraProps={extraProps}
              index={index}
              item={item}
              itemClassName={itemClassName}
              renderItem={renderItem}
              onItemInView={onItemInView}
            />
          </React.Fragment>
        );
      })}
      {isFetchingNextPage && (
        <div
          ref={reverseLoadingRef}
          className="flex items-center justify-center px-4 py-6"
        >
          <LoadingIndicator />
        </div>
      )}
    </div>
  );
};

const MemoizedFlatList = memo(FlatList) as typeof FlatList;

type FlatListItemProps<T, TExtra = undefined> = Pick<
  FlatListProps<T, TExtra>,
  'renderItem'
> & {
  index: number;
  item: T;
  onItemInView: (index: number) => void;
  itemClassName?: string;
  extraProps?: TExtra;
};

const FlatListItem = function <T, TExtra = undefined>({
  index,
  extraProps,
  item,
  onItemInView,
  renderItem,
  itemClassName,
}: FlatListItemProps<T, TExtra>) {
  const { ref: inViewRef, inView } = useInView({
    rootMargin: '0px 0px 400px 0px',
    threshold: 0,
  });

  useEffect(() => {
    if (inView) {
      onItemInView(index);
    }
  }, [inView, index, onItemInView]);

  return (
    <div className={itemClassName} ref={inViewRef}>
      {renderItem({ index, item, extra: extraProps })}
    </div>
  );
};

FlatListItem.displayName = 'FlatListItem';

const MemoizedFlatListItem = memo(FlatListItem) as typeof FlatListItem;

export { MemoizedFlatList as FlatList };
