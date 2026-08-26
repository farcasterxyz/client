import React, { useMemo } from 'react';
import { ColorValue, View, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

type Variant = 'secondary' | 'lightPurple' | 'success' | 'danger' | 'warn';
type Size = '18' | '32' | '40' | '64' | '80' | '100';

export function CircleIconBadge({
  Icon,
  size,
  variant,
  style,
}: {
  Icon: (props: { size: number; color: ColorValue }) => React.ReactNode;
  size: Size;
  variant: Variant;
  style?: ViewStyle | ViewStyle[];
}) {
  const t = useTheme();
  const diameter = parseInt(size);
  const bgColor = useMemo<string>(() => {
    switch (variant) {
      case 'secondary':
        return t.colors.bgMuted;
      case 'lightPurple':
        return t.colors.bgLightPurple;
      case 'success':
        return t.colors.bgLightGreen;
      case 'danger':
        return t.colors.bgLightRed;
      case 'warn':
        return t.colors.bgLightYellow;
    }
  }, [
    t.colors.bgLightGreen,
    t.colors.bgLightPurple,
    t.colors.bgLightRed,
    t.colors.bgLightYellow,
    t.colors.bgMuted,
    variant,
  ]);

  const iconSize = diameter / 2;
  const iconColor = useMemo<string>(() => {
    switch (variant) {
      case 'secondary':
        return t.colors.text.secondary;
      case 'lightPurple':
        return t.colors.text.brand;
      case 'success':
        return t.colors.text.success;
      case 'danger':
        return t.colors.text.danger;
      case 'warn':
        return t.colors.text.warning;
    }
  }, [
    t.colors.text.danger,
    t.colors.text.brand,
    t.colors.text.secondary,
    t.colors.text.success,
    t.colors.text.warning,
    variant,
  ]);

  return (
    <View
      style={[
        t.roundedFull,
        t.itemsCenter,
        t.justifyCenter,
        {
          backgroundColor: bgColor,
          width: diameter,
          height: diameter,
        },
        style,
      ]}
    >
      {Icon({ color: iconColor, size: iconSize })}
    </View>
  );
}
