import React, {
  forwardRef,
  memo,
  ReactElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useInView } from 'react-intersection-observer';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';

type FlatListProps<T, TExtra> = {
  data: T[] | undefined;
  emptyView: ReactElement;
  isFetchingNextPage?: boolean;
  isFetchingPreviousPage?: boolean;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: (() => void) | (() => Promise<void>);
  onStartReached?: (() => void) | (() => Promise<void>);
  onEndReachedThreshold?: number;
  onStartReachedThreshold?: number;
  renderItem: (params: {
    index: number;
    item: T;
    extra?: TExtra;
  }) => ReactElement;
  itemClassName?: string;
  onScroll?: (
    event: React.UIEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement>,
  ) => void;
  extraProps?: TExtra;
  initialScrollItemKey?: string;
};

export type FlatListRef = {
  scrollToIndex: (index: number) => void;
  scrollToBottom: () => void;
  disableAutoScrollToBottom: (disable: boolean) => void;
  getItemRef: (index: number) => HTMLDivElement | null;
};

type ItemPosition = {
  itemKey: string;
  offset: number;
};

function FlatListComponent<T, TExtra = undefined>(
  {
    data,
    emptyView,
    isFetchingNextPage,
    isFetchingPreviousPage,
    keyExtractor,
    extraProps,
    onEndReached,
    onStartReached,
    onEndReachedThreshold = 0.05,
    onStartReachedThreshold = 0.05,
    itemClassName,
    renderItem,
    onScroll,
    initialScrollItemKey,
  }: FlatListProps<T, TExtra>,
  ref: React.Ref<FlatListRef>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const displayData = useMemo(() => data || [], [data]);

  // Since newest messages are at index 0 and oldest at the end,
  // onEndReached should trigger when we're near index 0 (bottom visually),
  // and onStartReached should trigger when we're near the last index (top visually).
  const inViewBottomIndex = useMemo(() => {
    // Trigger near bottom if current visible index <= displayData.length * onEndReachedThreshold
    return Math.floor(displayData.length * onEndReachedThreshold);
  }, [displayData.length, onEndReachedThreshold]);

  const inViewTopIndex = useMemo(() => {
    // Trigger near top if current visible index >= (displayData.length - 1)*(1 - onStartReachedThreshold)
    if (!displayData.length) {
      return -1;
    }
    return Math.floor((displayData.length - 1) * (1 - onStartReachedThreshold));
  }, [displayData.length, onStartReachedThreshold]);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [autoScrollToBottomEnabled, setAutoScrollToBottomEnabled] =
    useState(true);

  const checkIfUserNearBottom = useCallback(() => {
    const c = containerRef.current;
    if (!c) {
      return;
    }
    const nearBottom = c.scrollTop > -100;
    setIsNearBottom(nearBottom);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const node = itemRefs.current[index];
    if (node && containerRef.current) {
      containerRef.current.scrollTop = node.offsetTop;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const c = containerRef.current;
    if (c) {
      // With column-reverse, the newest messages (index=0) are visually at the bottom.
      // Scrolling to bottom means setting scrollTop so that we see the first element at bottom.
      // scrollTop=scrollHeight puts us at the "lowest point" in the container,
      // showing the first elements (lowest indices) at the bottom.
      c.scrollTop = c.scrollHeight;
    }
  }, []);

  const disableAutoScrollToBottom = useCallback((disable: boolean) => {
    fetchLockRef.current = disable;
    setAutoScrollToBottomEnabled(!disable);
  }, []);

  const getItemRef = useCallback((index: number) => {
    return itemRefs.current[index] || null;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex,
      scrollToBottom,
      disableAutoScrollToBottom,
      getItemRef,
    }),
    [scrollToIndex, scrollToBottom, disableAutoScrollToBottom, getItemRef],
  );

  const lastInitialScrollKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (
      initialScrollItemKey &&
      displayData.length > 0 && // Only attempt scrolling if this is a new key or we haven't scrolled yet
      lastInitialScrollKeyRef.current !== initialScrollItemKey
    ) {
      const index = displayData.findIndex(
        (item, i) => keyExtractor(item, i) === initialScrollItemKey,
      );
      if (index !== -1) {
        requestAnimationFrame(() => {
          scrollToIndex(index);

          lastInitialScrollKeyRef.current = initialScrollItemKey;
        });
      }
    }
  }, [displayData, initialScrollItemKey, keyExtractor, scrollToIndex]);

  useLayoutEffect(() => {
    // Only auto-scroll to bottom if enabled, no initialScrollItemKey, and we are near bottom
    if (
      autoScrollToBottomEnabled &&
      !initialScrollItemKey &&
      isNearBottom &&
      containerRef.current
    ) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
    }
  }, [
    displayData,
    initialScrollItemKey,
    isNearBottom,
    autoScrollToBottomEnabled,
  ]);

  // We track the bottommost visible item so that when items are prepended
  // we can make sure that the scroll position doesn't visibly change
  const itemAtBottomOfScreenRef = React.useRef<ItemPosition | undefined>(
    undefined,
  );
  const scrollListener: React.UIEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      onScroll?.(e);
      checkIfUserNearBottom();

      if (!containerRef.current) {
        return;
      }
      const container = containerRef.current;

      for (const childNode of container.childNodes) {
        if (childNode.nodeType !== Node.ELEMENT_NODE) {
          // All elements should be divs not spans
          continue;
        }
        const childElement = childNode as HTMLElement;
        const top = childElement.offsetTop - container.offsetHeight;
        if (top <= container.scrollTop) {
          const itemKey = childElement.getAttribute('data-key');
          if (!itemKey) {
            continue;
          }
          itemAtBottomOfScreenRef.current = {
            itemKey,
            offset: container.scrollTop - top,
          };
          break;
        }
      }
    },
    [onScroll, checkIfUserNearBottom],
  );

  useLayoutEffect(() => {
    if (!containerRef.current || !data || !itemAtBottomOfScreenRef.current) {
      return;
    }
    const container = containerRef.current;

    // Note that scrollTop is a nonpositive value because of column-reverse
    for (const childNode of container.childNodes) {
      if (childNode.nodeType !== Node.ELEMENT_NODE) {
        // All elements should be divs not spans
        continue;
      }
      const childElement = childNode as HTMLElement;
      if (!childElement.hasAttribute('data-key')) {
        continue;
      }
      const itemKey = childElement.getAttribute('data-key');
      if (itemKey !== itemAtBottomOfScreenRef.current.itemKey) {
        continue;
      }
      const top = childElement.offsetTop - container.offsetHeight;
      const newScrollTop = top + itemAtBottomOfScreenRef.current.offset;
      container.scrollTop = newScrollTop;
      break;
    }
  }, [data]);

  const fetchLockRef = useRef(false);

  const onItemInView = useCallback(
    async (index: number) => {
      // If index <= inViewBottomIndex, user is near the bottom (lowest indices),
      // which means near the newest messages => trigger onEndReached
      if (
        onEndReached &&
        !isFetchingNextPage &&
        !fetchLockRef.current &&
        index <= inViewBottomIndex
      ) {
        fetchLockRef.current = true;
        const wasNearBottom = isNearBottom;
        await onEndReached();
        fetchLockRef.current = false;
        requestAnimationFrame(() => {
          if (
            wasNearBottom &&
            autoScrollToBottomEnabled &&
            containerRef.current
          ) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
          // Unlock after fetch completes and DOM updates
          fetchLockRef.current = false;
        });
      }

      // If index >= inViewTopIndex, user is near the top (highest indices),
      // which means near the oldest messages => trigger onStartReached
      if (
        onStartReached &&
        !isFetchingPreviousPage &&
        !fetchLockRef.current &&
        index >= inViewTopIndex
      ) {
        fetchLockRef.current = true;
        await onStartReached();
        requestAnimationFrame(() => {
          // Unlock after fetch completes and DOM updates
          fetchLockRef.current = false;
        });
      }
    },
    [
      autoScrollToBottomEnabled,
      inViewBottomIndex,
      inViewTopIndex,
      isFetchingNextPage,
      isFetchingPreviousPage,
      isNearBottom,
      onEndReached,
      onStartReached,
    ],
  );

  if (
    displayData.length === 0 &&
    !isFetchingNextPage &&
    !isFetchingPreviousPage
  ) {
    return emptyView;
  }

  return (
    <div
      className="scrollbar-vert flex h-full flex-col-reverse overflow-y-auto overflow-x-hidden pb-2"
      ref={containerRef}
      onWheel={scrollListener}
      onScroll={scrollListener}
    >
      {isFetchingPreviousPage && (
        <div className="flex items-center justify-center px-4 py-2">
          <LoadingIndicator />
        </div>
      )}
      {displayData.map((item, index) => {
        const itemKey = keyExtractor(item, index);
        return (
          <MemoizedFlatListItem
            key={itemKey}
            itemKey={itemKey}
            extraProps={extraProps}
            index={index}
            item={item}
            itemClassName={itemClassName}
            renderItem={renderItem}
            onItemInView={onItemInView}
            itemRef={(node) => (itemRefs.current[index] = node)}
          />
        );
      })}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center px-4 py-2">
          <LoadingIndicator />
        </div>
      )}
    </div>
  );
}

type FlatListItemProps<T, TExtra = undefined> = Pick<
  FlatListProps<T, TExtra>,
  'renderItem'
> & {
  index: number;
  item: T;
  onItemInView: (index: number) => void;
  itemClassName?: string;
  extraProps?: TExtra;
  itemRef: (node: HTMLDivElement | null) => void;
  itemKey: string;
};

const FlatListItem = function <T, TExtra = undefined>({
  index,
  extraProps,
  item,
  onItemInView,
  renderItem,
  itemClassName,
  itemRef,
  itemKey,
}: FlatListItemProps<T, TExtra>) {
  const { ref: inViewRef, inView } = useInView({ threshold: 0.01 });
  useEffect(() => {
    if (inView) {
      onItemInView(index);
    }
  }, [inView, index, onItemInView]);

  return (
    <div
      className={itemClassName}
      ref={(el) => {
        inViewRef(el);
        itemRef(el);
      }}
      data-index={index}
      data-key={itemKey}
    >
      {renderItem({ index, item, extra: extraProps })}
    </div>
  );
};

FlatListItem.displayName = 'FlatListItem';
const MemoizedFlatListItem = memo(FlatListItem) as typeof FlatListItem;

export const BidirectionalFlatList = forwardRef(FlatListComponent) as <
  T,
  TExtra = undefined,
>(
  props: FlatListProps<T, TExtra> & { ref?: React.Ref<FlatListRef> },
) => ReactElement | null;
