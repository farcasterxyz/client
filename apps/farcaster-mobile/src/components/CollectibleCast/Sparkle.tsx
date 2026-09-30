import React from 'react';
import { AppState, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useAnimationPauseOnBackground } from '~/hooks/useAnimationPauseOnBackground';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export const Sparkle = React.memo(
  ({
    size = 24,
    color,
    fill,
    isSpinning = false,
    strokeWidth = 2.5,
    style,
  }: {
    size?: number;
    color?: string;
    fill?: string;
    isSpinning?: boolean;
    strokeWidth?: number;
    style?: StyleProp<ViewStyle>;
  }) => {
    const rotation = useSharedValue(0);

    const startAnimation = React.useCallback(() => {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
      );
    }, [rotation]);

    const stopAnimation = React.useCallback(() => {
      cancelAnimation(rotation);
      // Preserve the pre-Phase-3 UX: when `isSpinning` flips false in the
      // foreground, smoothly decelerate back to 0deg over 500ms. When the
      // stop is triggered by the app going to background, snap to 0 so we
      // don't keep ticking an invisible animation on resume.
      if (AppState.currentState === 'active') {
        rotation.value = withTiming(0, { duration: 500 });
      } else {
        rotation.value = 0;
      }
    }, [rotation]);

    useAnimationPauseOnBackground({
      enabled: isSpinning,
      startAnimation,
      stopAnimation,
    });

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ rotate: `${rotation.value}deg` }],
      };
    });

    return (
      <AnimatedSvg
        viewBox="-1 -1 26 26"
        width={size}
        height={size}
        style={[animatedStyle, style]}
      >
        <Path
          d="M11.191.565c.275-.754 1.342-.753 1.618 0l1.918 5.238a5.83 5.83 0 0 0 3.47 3.47l5.237 1.918c.755.275.755 1.342 0 1.618l-5.237 1.918a5.83 5.83 0 0 0-3.47 3.47l-1.918 5.237c-.276.755-1.343.755-1.618 0l-1.918-5.237a5.83 5.83 0 0 0-3.47-3.47L.565 12.809c-.753-.276-.754-1.342 0-1.618l5.238-1.918a5.83 5.83 0 0 0 3.47-3.47L11.191.565Z"
          stroke={color}
          fill={fill || 'none'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </AnimatedSvg>
    );
  },
);
