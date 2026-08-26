// eslint-disable-next-line no-restricted-imports
import { useScrollToTop } from '@react-navigation/native';
import { RefObject, useRef } from 'react';
import { FlatList } from 'react-native';
import { useCollapsibleStyle } from 'react-native-collapsible-tab-view';

const useScrollToTopWithCollapsibleHeader = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flatListRef: RefObject<FlatList<any> | null>,
) => {
  const style = useCollapsibleStyle();

  useScrollToTop(
    useRef({
      scrollToTop: () => {
        flatListRef.current?.scrollToOffset({
          offset: style.contentContainerStyle.minHeight + 10,
        });
      },
    }),
  );
};

export { useScrollToTopWithCollapsibleHeader };
