// eslint-disable-next-line no-restricted-imports
import { useScrollToTop as useScrollToTopReactNavigation } from '@react-navigation/native';
import { FlashListRef } from '@shopify/flash-list';
import { RefObject } from 'react';
import { FlatList } from 'react-native';

const useScrollToTop = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: RefObject<FlatList<any> | FlashListRef<any> | null>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useScrollToTopReactNavigation(ref as any);
};

export { useScrollToTop };
