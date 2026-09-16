import React from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../../contexts/ThemeContext';
import { useSafeFocusEffect } from '../../hooks/useSafeFocusEffect';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ActivitySpinnerProps = {
  duration?: number;
  size?: number;
  strokeWidth?: number;
  stroke?: string;
};

export function ActivitySpinner({
  duration = 1000,
  size = 80,
  strokeWidth = 8,
  stroke: strokeFromProps,
}: ActivitySpinnerProps) {
  const t = useTheme();
  const progress = useSharedValue(0);

  const stroke = strokeFromProps || t.colors.text.brand;

  useSafeFocusEffect(
    React.useCallback(() => {
      progress.value = withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false,
      );

      return () => {
        cancelAnimation(progress);
        progress.value = 0;
      };
    }, [progress, duration]),
  );

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference / 3;

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [arcLength, circumference - arcLength],
    strokeDashoffset: -progress.value * circumference,
    strokeOpacity: 0.9,
  }));

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={t.colors.bgMuted}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        animatedProps={animatedProps}
        strokeLinecap="round"
      />
    </Svg>
  );
}

ActivitySpinner.displayName = 'ActivitySpinner';
