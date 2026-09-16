import React, { useCallback, useMemo } from 'react';
import { ColorValue, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { hitSlop } from '../../../constants/Pressable';
import { useTheme } from '../../../contexts/ThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';

type IconButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'quaternary';

type IconButtonSize = '32' | '36';

export type IconButtonProps = {
  Icon: ({
    size,
    color,
  }: {
    size: number;
    color: ColorValue;
  }) => React.ReactNode;
  onPress: () => void;
  size: IconButtonSize;
  variant?: IconButtonVariant;
  haptics?: boolean;
};

export function IconButton({
  Icon,
  size,
  onPress,
  variant = 'primary',
  haptics = false,
}: IconButtonProps) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const diameter = useMemo(() => parseInt(size), [size]);
  const iconSize = useMemo(() => {
    switch (size) {
      case '32':
        return 16;
      case '36':
        return 16;
    }
  }, [size]);

  const iconColor = useMemo(() => {
    switch (variant) {
      case 'primary':
        return t.colors.text.light;
      case 'secondary':
      case 'tertiary':
        return t.colors.text.primary;
      case 'quaternary':
        return t.colors.text.brand;
    }
  }, [
    t.colors.text.primary,
    t.colors.text.light,
    t.colors.text.brand,
    variant,
  ]);

  const bgColor = useMemo<ColorValue>(() => {
    switch (variant) {
      case 'primary':
        return t.colors.actionPrimary;
      case 'secondary':
        return t.colors.actionSecondary;
      case 'tertiary':
        return 'transparent';
      case 'quaternary':
        return t.colors.actionQuaternary;
    }
  }, [
    variant,
    t.colors.actionPrimary,
    t.colors.actionSecondary,
    t.colors.actionQuaternary,
  ]);

  const borderColor = useMemo<ColorValue>(() => {
    switch (variant) {
      case 'primary':
        return t.colors.actionPrimary;
      case 'secondary':
        return t.colors.actionSecondary;
      case 'tertiary':
        return t.colors.borderDefault;
      case 'quaternary':
        return t.colors.actionQuaternary;
    }
  }, [
    t.colors.actionPrimary,
    t.colors.actionQuaternary,
    t.colors.actionSecondary,
    t.colors.borderDefault,
    variant,
  ]);

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
        scale.value = withSpring(0.9);
      }}
      onTouchEnd={() => {
        scale.value = withSpring(1);
      }}
      hitSlop={hitSlop}
    >
      <Animated.View
        style={[
          animatedStyle,
          t.relative,
          t.roundedFull,
          t.flex,
          t.itemsCenter,
          t.justifyCenter,
          {
            backgroundColor: bgColor,
            borderWidth: 1,
            borderColor: borderColor,
            width: diameter,
            height: diameter,
          },
        ]}
      >
        {Icon({ size: iconSize, color: iconColor })}
      </Animated.View>
    </Pressable>
  );
}
