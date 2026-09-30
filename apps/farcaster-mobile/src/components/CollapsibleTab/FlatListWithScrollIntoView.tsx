import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleProp,
  ViewStyle,
  ViewToken,
} from 'react-native';

type TabItem = { key: string };

export type TabItemWithActive<ItemType extends TabItem> = {
  item: ItemType;
  isActive: boolean;
};

type FlatListWithScrollIntoViewProps<ItemType extends TabItem> = {
  data: ItemType[];
  renderItem: ListRenderItem<TabItemWithActive<ItemType>>;
  contentContainerStyle?: StyleProp<ViewStyle> | undefined;
  selectedKey: string;
};

const FlatListWithScrollIntoView = <ItemType extends TabItem>(
  props: FlatListWithScrollIntoViewProps<ItemType>,
) => {
  const { selectedKey, data, renderItem, contentContainerStyle } = props;

  const dataWithActive = useMemo(() => {
    return data.map((item) => {
      return {
        item,
        isActive: item.key === selectedKey,
      };
    });
  }, [data, selectedKey]);

  const flatListRef = useRef<FlatList>(null);
  const visibleItemIndices = useRef<number[]>([]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      visibleItemIndices.current = viewableItems.reduce((acc, item) => {
        if (item.index !== null) {
          acc.push(item.index);
        }
        return acc;
      }, [] as number[]);
    },
    [],
  );

  useEffect(() => {
    if (!selectedKey) {
      return;
    }

    if (flatListRef.current) {
      const selectedIndex = data.findIndex((item) => item.key === selectedKey);
      if (!visibleItemIndices.current.includes(selectedIndex)) {
        const firstVisibleKey = visibleItemIndices.current[0];
        flatListRef.current.scrollToIndex({
          index: selectedIndex,
          animated: true,
          viewPosition: selectedIndex < firstVisibleKey ? 0 : 1,
        });
      }
    }
  }, [data, selectedKey]);

  return (
    <FlatList
      data={dataWithActive}
      renderItem={renderItem}
      contentContainerStyle={contentContainerStyle}
      horizontal
      showsHorizontalScrollIndicator={false}
      ref={flatListRef}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 100,
      }}
    />
  );
};

FlatListWithScrollIntoView.displayName = 'FlatListWithScrollIntoView';

export { FlatListWithScrollIntoView };
