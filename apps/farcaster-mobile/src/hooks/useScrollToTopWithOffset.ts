import { LegendListRef } from '@legendapp/list';
// eslint-disable-next-line no-restricted-imports
import { useScrollToTop } from '@react-navigation/native';
import { FlashListRef } from '@shopify/flash-list';
import { RefObject, useRef } from 'react';
import { FlatList } from 'react-native';
import Reanimated from 'react-native-reanimated';

const useScrollToTopWithOffset = (
  flatListRef: RefObject<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | FlatList<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | FlashListRef<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Reanimated.FlatList<any>
    | LegendListRef
    | null
  >,
  offset: number,
  onScrollToTop?: () => void,
) => {
  useScrollToTop(
    useRef({
      scrollToTop: () => {
        flatListRef.current?.scrollToOffset({ offset });
        if (onScrollToTop) {
          onScrollToTop();
        }
      },
    }),
  );
};

export { useScrollToTopWithOffset };
