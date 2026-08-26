import React, { useCallback } from 'react';
import { ColorValue, View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';
import { AnimatedPressable } from '../AnimatedPressable';
import { Text2 } from '../Text';

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

  const wrappedOnPress = useCallback(() => {
    if (haptics) {
      triggerImpactAsync();
    }

    onPress();
  }, [haptics, onPress, triggerImpactAsync]);

  return (
    <AnimatedPressable
      onPress={wrappedOnPress}
      disabled={disabled}
      style={disabled ? t.opacity50 : undefined}
    >
      <View
        style={[
          t.flex,
          t.wFull,
          t.itemsCenter,
          t.justifyCenter,
          t.bgLightGray,
          t.pX2,
          t.pY3,
          {
            borderRadius: 16,
            gap: 6,
          },
        ]}
      >
        {Icon({ size: 24, color: t.colors.actionPrimary })}
        <Text2 color="secondary" size="xs" weight="semibold">
          {title}
        </Text2>
      </View>
    </AnimatedPressable>
  );
}
