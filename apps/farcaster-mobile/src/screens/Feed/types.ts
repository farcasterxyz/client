import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

export interface FeedTabProps {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  headerHeight: number;
  headerTranslateY: Animated.Value;
}
