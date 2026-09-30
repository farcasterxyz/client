import { useIsFocused } from '@react-navigation/native';
import { Text2 } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '~/contexts/ThemeProvider';
import { useAnimationPauseOnBackground } from '~/hooks/useAnimationPauseOnBackground';

const PLACEHOLDER_OPTIONS = ['casts', 'users', 'tokens', 'channels'];
const ANIMATION_DURATION = 300;
const DISPLAY_DURATION = 1500;

export const AnimatedSearchPlaceholder: React.FC = () => {
  const t = useTheme();
  const isFocused = useIsFocused();
  const currentIndex = useSharedValue(0);
  const animationProgress = useSharedValue(1); // Start at 1 to show first option

  const startAnimation = React.useCallback(() => {
    animationProgress.value = withDelay(
      DISPLAY_DURATION,
      withRepeat(
        withSequence(
          withTiming(2, {
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.quad),
          }),
          withTiming(0, { duration: 0 }, () => {
            'worklet';
            currentIndex.value =
              (currentIndex.value + 1) % PLACEHOLDER_OPTIONS.length;
          }),
          withTiming(1, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.quad),
          }),
          withDelay(DISPLAY_DURATION, withTiming(1, { duration: 0 })),
        ),
        -1, // repeat forever
        false,
      ),
    );
  }, [animationProgress, currentIndex]);

  const stopAnimation = React.useCallback(() => {
    cancelAnimation(animationProgress);
    animationProgress.value = 1;
    currentIndex.value = 0;
  }, [animationProgress, currentIndex]);

  useAnimationPauseOnBackground({
    enabled: isFocused,
    startAnimation,
    stopAnimation,
  });

  return (
    <View style={[t.flexRow, t.itemsCenter]}>
      <Text2 align="left" weight="medium" style={t.texts.tertiary}>
        Search{' '}
      </Text2>
      <View
        style={{
          position: 'relative',
          height: 20,
          width: 100,
          overflow: 'visible',
        }}
      >
        {PLACEHOLDER_OPTIONS.map((option, index) => (
          <AnimatedOption
            key={index}
            option={option}
            index={index}
            currentIndex={currentIndex}
            animationProgress={animationProgress}
          />
        ))}
      </View>
    </View>
  );
};

interface AnimatedOptionProps {
  option: string;
  index: number;
  currentIndex: SharedValue<number>;
  animationProgress: SharedValue<number>;
}

const AnimatedOption: React.FC<AnimatedOptionProps> = ({
  option,
  index,
  currentIndex,
  animationProgress,
}) => {
  const t = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = currentIndex.value === index;
    if (!isActive) {
      return {
        opacity: 0,
        transform: [{ translateY: -20 }],
        position: 'absolute' as const,
        left: 0,
        top: 0,
      };
    }

    const progress = animationProgress.value;

    if (progress <= 1) {
      // Showing or sliding in
      const translateY = interpolate(progress, [0, 1], [-20, 0]);
      const opacity = interpolate(progress, [0, 1], [0, 1]);
      return {
        opacity,
        transform: [{ translateY }],
        position: 'absolute' as const,
        left: 0,
        top: 0,
      };
    } else {
      // Sliding out to bottom
      const translateY = interpolate(progress, [1, 2], [0, 20]);
      const opacity = interpolate(progress, [1, 2], [1, 0]);
      return {
        opacity,
        transform: [{ translateY }],
        position: 'absolute' as const,
        left: 0,
        top: 0,
      };
    }
  });

  return (
    <Animated.View style={animatedStyle}>
      <Text2 align="left" weight="medium" style={t.texts.tertiary}>
        {option}
      </Text2>
    </Animated.View>
  );
};
