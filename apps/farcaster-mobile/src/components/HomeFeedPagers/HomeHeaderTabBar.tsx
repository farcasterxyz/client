import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export type TabBarItem =
  | string
  | {
      key: string;
      label: string;
      renderIcon?: (props: {
        color: string;
        selected: boolean;
        size: number;
      }) => React.ReactNode;
    };

export interface TabBarProps {
  selectedPage: number;
  items: TabBarItem[];
  onSelect?: (index: number) => void;
  onPressSelected?: (index: number) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

// How much of the previous/next item we're showing
// to give the user a hint there's more to scroll.
const OFFSCREEN_ITEM_WIDTH = 20;

const getItemKey = (item: TabBarItem) =>
  typeof item === 'string' ? item : item.key;

const getItemLabel = (item: TabBarItem) =>
  typeof item === 'string' ? item : item.label;

const getItemIcon = (item: TabBarItem) =>
  typeof item === 'string' ? undefined : item.renderIcon;

export function TabBar({
  selectedPage,
  items,
  onSelect,
  onPressSelected,
  onLayout,
  containerStyle,
}: TabBarProps) {
  const t = useTheme();
  const scrollElRef = useRef<ScrollView>(null);
  const itemRefs = useRef<Array<View>>([]);
  const [itemXs, setItemXs] = useState<number[]>([]);
  const hasIconItems = items.some(
    (item) => typeof getItemIcon(item) !== 'undefined',
  );

  useEffect(() => {
    if (hasIconItems) {
      return;
    }

    let x = itemXs[selectedPage] || 0;
    x = Math.max(0, x - OFFSCREEN_ITEM_WIDTH);
    scrollElRef.current?.scrollTo({ x });
  }, [hasIconItems, scrollElRef, itemXs, selectedPage]);

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index);
      if (index === selectedPage) {
        onPressSelected?.(index);
      }
    },
    [onSelect, selectedPage, onPressSelected],
  );

  // calculates the x position of each item on mount and on layout change
  const onItemLayout = React.useCallback(
    (e: LayoutChangeEvent, index: number) => {
      const x = e.nativeEvent.layout.x;
      setItemXs((prev) => {
        const Xs = [...prev];
        Xs[index] = x;
        return Xs;
      });
    },
    [],
  );

  return (
    <View
      style={[t.relative, t.flexRow, hasIconItems ? t.wFull : undefined]}
      onLayout={onLayout}
    >
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={scrollElRef}
        scrollEnabled={!hasIconItems}
        style={hasIconItems ? t.flex1 : undefined}
        contentContainerStyle={
          hasIconItems
            ? [{ flexGrow: 1 }, containerStyle]
            : containerStyle
              ? containerStyle
              : [t.pX2]
        }
      >
        {items.map((item, i) => {
          const selected = i === selectedPage;
          const label = getItemLabel(item);
          const renderIcon = getItemIcon(item);
          const color = selected
            ? t.colors.text.primary
            : t.colors.text.tertiary;

          return (
            <Pressable
              key={`${getItemKey(item)}-${i}`}
              ref={(node) => {
                itemRefs.current[i] = node as View;
              }}
              onLayout={(e) => onItemLayout(e, i)}
              style={[
                hasIconItems
                  ? { flex: 1, alignItems: 'center', paddingTop: 10 }
                  : { paddingTop: 10, paddingHorizontal: 10 },
                t.justifyCenter,
              ]}
              onPress={() => onPressItem(i)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
            >
              <View
                style={[
                  t.relative,
                  t.justifyCenter,
                  { paddingBottom: 6, paddingHorizontal: 3 },
                ]}
              >
                {renderIcon ? (
                  renderIcon({ color, selected, size: 20 })
                ) : (
                  <Text
                    style={[
                      t.textBase,
                      t.fontSemibold,
                      selected ? t.texts.primary : t.texts.tertiary,
                      { lineHeight: 20 } satisfies TextStyle,
                    ]}
                  >
                    {label}
                  </Text>
                )}
              </View>
              <View
                style={{
                  height: 3,
                  width: hasIconItems ? 36 : undefined,
                  backgroundColor: selected
                    ? t.colors.text.brand
                    : 'transparent',
                  borderRadius: 1.5,
                  marginTop: 2,
                }}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
