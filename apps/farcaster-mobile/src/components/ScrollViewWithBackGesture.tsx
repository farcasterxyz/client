import React from 'react';
import { NativeScrollEvent, Platform, ScrollViewProps } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureType,
  ScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export const ScrollViewWithBackGesture = (
  props: Omit<ScrollViewProps, 'onScroll' | 'onMomentumEnd'> & {
    onScroll?: (event: NativeScrollEvent) => void;
    onMomentumEnd?: (event: NativeScrollEvent) => void;
    // Resets the horizontal scroll offset to 0 when this value changes.
    // Used to clear stale scroll position on FlashList cell recycle.
    resetScrollKey?: string;
  },
) => {
  const {
    children,
    onScroll,
    onMomentumEnd,
    resetScrollKey,
    ...scrollViewProps
  } = props;
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const scrollEnabled = useSharedValue(true);
  const scrollOffset = useSharedValue(0);
  const x = useSharedValue(1000);
  const hasHandledResetScrollKey = React.useRef(false);

  // Use reanimated's worklet `scrollTo` rather than the ref's imperative
  // method — the ref points at the Animated wrapper, which doesn't
  // reliably forward `scrollTo` to the host component.
  React.useEffect(() => {
    if (resetScrollKey === undefined) {
      return;
    }
    if (!hasHandledResetScrollKey.current) {
      hasHandledResetScrollKey.current = true;
      return;
    }
    scrollOffset.value = 0;
    runOnUI(() => {
      'worklet';
      scrollTo(scrollViewRef, 0, 0, false);
    })();
  }, [resetScrollKey, scrollOffset, scrollViewRef]);

  const gestureRef = React.useRef<GestureType>(Gesture.Native());
  // Memoize the gesture so FlashList cell recycling doesn't recreate it every
  // render — a new Gesture identity forces gesture-handler to tear down and
  // reattach the detector (gestureWillMount/attachHandlers) on each recycle.
  // The touch worklets only close over stable shared-value refs, so this is
  // safe to build once for the component's lifetime.
  const gesture = React.useMemo(
    () =>
      Gesture.Native()
        .withRef(gestureRef)
        .onTouchesDown((event) => {
          const currentX = event.allTouches[0].absoluteX;
          x.value = currentX;
          scrollEnabled.value = true;
        })
        .onTouchesMove((event) => {
          const currentX = event.allTouches[0].absoluteX;
          if (currentX >= x.value && scrollOffset.value === 0) {
            scrollEnabled.value = false;
          } else {
            scrollEnabled.value = true;
          }
          x.value = currentX;
        })
        .onTouchesCancelled(() => {
          x.value = 1000;
          scrollEnabled.value = true;
        })
        .enabled(Platform.OS === 'ios'),
    [scrollEnabled, scrollOffset, x],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      if (onScroll) {
        runOnJS(onScroll)(event);
      }
      scrollOffset.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      'worklet';
      if (onMomentumEnd) {
        runOnJS(onMomentumEnd)(event);
      }
    },
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      scrollEnabled: scrollEnabled.value,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <AnimatedScrollView
        ref={scrollViewRef}
        // This component exists exclusively to wrap horizontal scrollers
        // (it tracks horizontal touches to coordinate with the iOS
        // back-gesture). Lock the direction and disable vertical bounce
        // by default so a layout-cache miscalculation that produces
        // `contentSize.height > layoutHeight` cannot expose vertical
        // pannability on a carousel that is meant to scroll horizontally.
        // Callers should also pin an explicit height on the ScrollView
        // (or its contentContainerStyle) when their content has a fixed
        // intrinsic height — that's the only way to guarantee
        // `contentSize.height === layoutHeight` and prevent iOS from
        // surfacing a vertical scroll indicator on recycled cells whose
        // measured child heights have drifted.
        // Callers can still override these via the spread below.
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
        directionalLockEnabled
        {...scrollViewProps}
        onScroll={scrollHandler}
        animatedProps={animatedProps}
        simultaneousHandlers={[gestureRef]}
      >
        {children}
      </AnimatedScrollView>
    </GestureDetector>
  );
};
