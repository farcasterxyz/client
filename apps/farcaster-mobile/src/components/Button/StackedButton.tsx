import React, { useCallback } from 'react';
import { ColorValue, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text2 } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

export type StackedButtonProps = {
  Icon: ({
    size,
    color,
  }: {
    size: number;
    color: ColorValue;
  }) => React.ReactNode;
  onPress: () => void;
  title: string;
  haptics?: boolean;
  disabled?: boolean;
};

export function StackedButton({
  Icon,
  onPress,
  title,
  disabled,
  haptics = false,
}: StackedButtonProps) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const wrappedOnPress = useCallback(() => {
    if (haptics) {
      triggerImpactAsync();
    }

    onPress();
  }, [haptics, onPress, triggerImpactAsync]);

  return (
    <Pressable
      onPress={wrappedOnPress}
      onTouchStart={() => {
        if (!disabled) {
          scale.value = withSpring(0.93);
        }
      }}
      onTouchEnd={() => {
        scale.value = withSpring(1);
      }}
      hitSlop={hitSlop}
      disabled={disabled}
      style={disabled ? t.opacity50 : undefined}
    >
      <Animated.View
        style={[
          animatedStyle,
          t.flex,
          t.wFull,
          t.itemsCenter,
          t.justifyCenter,
          t.bgSwap,
          {
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 16,
            gap: 6,
          },
        ]}
      >
        {Icon({ size: 24, color: t.colors.actionPrimary })}
        <Text2 color="secondary" size="sm" weight="semibold">
          {title}
        </Text2>
      </Animated.View>
    </Pressable>
  );
}
