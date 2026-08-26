import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '~/contexts/ThemeProvider';

type AnimatedPressableCircleProps = {
  onPress: () => void;
  onPressIn?: () => void;
  children: React.ReactNode;
  background: 'active' | 'muted';
};

/**
 * @deprecated Use AnimatedPressable from farcaster-expo instead
 */
const AnimatedPressableCircle: React.FC<AnimatedPressableCircleProps> = ({
  onPress,
  onPressIn,
  children,
  background,
}) => {
  const t = useTheme();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      style={[
        t.w14,
        t.h14,
        t.roundedFull,
        t.flex,
        t.flexCol,
        t.itemsCenter,
        t.justifyCenter,
        t.relative,
        background === 'active' ? t.bgAction : t.bgMuted,
        animatedStyle,
      ]}
      onTouchStart={() => {
        scale.value = withSpring(0.9);
        onPressIn?.();
      }}
      onTouchEnd={() => {
        scale.value = withSpring(1);
      }}
    >
      <Pressable
        style={[
          t.inset0,
          t.wFull,
          t.hFull,
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          t.flex,
          t.flexCol,
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

AnimatedPressableCircle.displayName = 'AnimatedPressableCircle';

export { AnimatedPressableCircle };
