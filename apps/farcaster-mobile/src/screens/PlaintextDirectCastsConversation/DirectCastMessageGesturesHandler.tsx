import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type DirectCastMessageGesturesHandlerProps = {
  children: React.ReactNode;
  onDoubleTap: () => void;
  onPressAndHold: () => void;
  disabled: boolean;
};

const DirectCastMessageGesturesHandler: React.FC<DirectCastMessageGesturesHandlerProps> =
  React.memo(({ children, onDoubleTap, onPressAndHold, disabled }) => {
    // In case we have some issues on Android for perf - we can bypass the gesture
    // handling here.
    if (disabled) {
      return <>{children}</>;
    }

    return (
      <DirectCastMessageGesturesHandlerInner
        onDoubleTap={onDoubleTap}
        onPressAndHold={onPressAndHold}
      >
        {children}
      </DirectCastMessageGesturesHandlerInner>
    );
  });

DirectCastMessageGesturesHandler.displayName =
  'DirectCastMessageGesturesHandler';

type DirectCastMessageGesturesHandlerInnerProps = {
  children: React.ReactNode;
  onDoubleTap: () => void;
  onPressAndHold: () => void;
};

const DirectCastMessageGesturesHandlerInner: React.FC<DirectCastMessageGesturesHandlerInnerProps> =
  React.memo(({ children, onDoubleTap, onPressAndHold }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const doubleTapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(onDoubleTap)
      .runOnJS(true);

    const shrink = React.useCallback(() => {
      'worklet';
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 200 });
    }, [scale]);

    const pressAndHoldGesture = Gesture.LongPress()
      .minDuration(300)
      .onStart(() => {
        scale.value = withTiming(0.985, { duration: 200 }, (finished) => {
          if (!finished) {
            return;
          }
          runOnJS(onPressAndHold)();
          shrink();
        });
      })
      .onTouchesUp(shrink)
      .cancelsTouchesInView(false)
      .runOnJS(true);

    const composedGestures = Gesture.Exclusive(
      doubleTapGesture,
      pressAndHoldGesture,
    );

    return (
      <GestureDetector gesture={composedGestures}>
        <Animated.View style={[animatedStyle]}>{children}</Animated.View>
      </GestureDetector>
    );
  });

DirectCastMessageGesturesHandlerInner.displayName =
  'DirectCastMessageGesturesHandlerInner';

export { DirectCastMessageGesturesHandler };
