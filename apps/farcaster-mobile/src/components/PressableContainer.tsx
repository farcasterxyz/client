import React, { FC, memo } from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

interface PressableContainerProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  haptics?: boolean;
}

export const PressableContainer: FC<PressableContainerProps> = memo(
  ({
    children,
    onPress,
    disabled = false,
    fullWidth = false,
    haptics = true,
    style,
  }) => {
    const t = useTheme();
    const { triggerImpactAsync } = useHaptics();

    const handlePress = () => {
      if (haptics) {
        triggerImpactAsync();
      }
      onPress();
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[
          t.flexRow,
          t.itemsCenter,
          t.roundedLg,
          t.borders.primary,
          t.backgrounds.secondary,
          fullWidth && t.wFull,
          style,
        ]}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  },
);

PressableContainer.displayName = 'PressableContainer';
