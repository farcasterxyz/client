import React, { useCallback } from 'react';
import {
  GestureResponderEvent,
  Insets,
  Platform,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { hitSlop } from '../../constants';
import { useTheme } from '../../contexts';
import {
  PressableAnimationOptions,
  useHaptics,
  usePressableAnimation,
} from '../../hooks';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = PressableProps & {
  animation?: Omit<PressableAnimationOptions, 'colors' | 'enabled'>;
  color?: PressableAnimationOptions['color'];
  disableAnimation?: boolean;
  disableHaptics?: boolean;
  hitSlop?: Insets;
};

function AnimatedPressable(props: AnimatedPressableProps) {
  const { disableAnimation, ...rest } = props;

  if (disableAnimation || Platform.OS === 'android') {
    return <UnanimatedPressable {...rest} />;
  }

  return <AnimatedPressableInner {...rest} />;
}

AnimatedPressable.displayName = 'AnimatedPressable';

function UnanimatedPressable(props: AnimatedPressableProps) {
  const t = useTheme();

  const {
    children,
    onPress,
    onPressIn,
    onPressOut,
    disableHaptics,
    hitSlop: hitSlopOverride,
    ...rest
  } = props;

  const { triggerImpactAsync } = useHaptics();

  const wrappedOnPress = useCallback(
    (event: GestureResponderEvent) => {
      if (!disableHaptics) {
        triggerImpactAsync();
      }

      if (onPress) {
        onPress(event);
      }
    },
    [onPress, triggerImpactAsync, disableHaptics],
  );

  const wrappedOnPressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (onPressIn) {
        onPressIn(event);
      }
    },
    [onPressIn],
  );

  const wrappedOnPressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (onPressOut) {
        onPressOut(event);
      }
    },
    [onPressOut],
  );

  const style = useCallback(
    ({ pressed }: PressableStateCallbackType) => {
      const opacity = pressed ? 0.6 : 1;
      switch (props.color) {
        case 'lightGray':
          return [
            { backgroundColor: t.colors.bgNewLightGray, opacity },
            props.style,
          ] as ViewStyle[];
        case 'transparent':
          return [
            {
              backgroundColor: t.colors.bgDefault,
              opacity,
            },
            props.style,
          ] as ViewStyle[];
        default:
          return [{ opacity }, props.style] as ViewStyle[];
      }
    },
    [props.color, props.style, t.colors.bgDefault, t.colors.bgNewLightGray],
  );

  return (
    <Pressable
      {...rest}
      style={style}
      onPress={wrappedOnPress}
      onPressIn={wrappedOnPressIn}
      onPressOut={wrappedOnPressOut}
      hitSlop={hitSlopOverride ?? hitSlop}
    >
      {children}
    </Pressable>
  );
}

function AnimatedPressableInner({
  children,
  animation,
  color,
  onPress,
  onPressIn,
  onPressOut,
  disableHaptics,
  hitSlop: hitSlopOverride,
  ...props
}: AnimatedPressableProps) {
  const {
    animatedStyle,
    pressHandlers: {
      onPressIn: animationOnPressIn,
      onPressOut: animationOnPressOut,
    },
  } = usePressableAnimation({
    ...animation,
    color,
  });

  const { triggerImpactAsync } = useHaptics();

  const wrappedOnPress = useCallback(
    (event: GestureResponderEvent) => {
      if (!disableHaptics) {
        triggerImpactAsync();
      }

      onPress?.(event);
    },
    [disableHaptics, onPress, triggerImpactAsync],
  );

  const wrappedOnPressIn = useCallback(
    (event: GestureResponderEvent) => {
      animationOnPressIn();

      onPressIn?.(event);
    },
    [animationOnPressIn, onPressIn],
  );

  const wrappedOnPressOut = useCallback(
    (event: GestureResponderEvent) => {
      animationOnPressOut();

      onPressOut?.(event);
    },
    [animationOnPressOut, onPressOut],
  );

  return (
    <AnimatedPressableComponent
      {...props}
      onPressIn={wrappedOnPressIn}
      onPressOut={wrappedOnPressOut}
      onPress={wrappedOnPress}
      style={[animatedStyle, props.style]}
      hitSlop={hitSlopOverride ?? hitSlop}
    >
      {children}
    </AnimatedPressableComponent>
  );
}
export { AnimatedPressable };
