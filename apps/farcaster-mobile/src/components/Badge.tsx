import React, { ComponentType, useMemo } from 'react';
import { ColorValue, View } from 'react-native';

import { Text2, TextSize } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type BadgeColor = 'primary' | 'secondary';
type BadgeSize = 'xs';

const badgeToTextSize: Record<BadgeSize, TextSize> = {
  xs: 'xs',
};

export function Badge({
  label,
  color,
  size,
  Icon,
}: {
  label?: string;
  color: BadgeColor;
  size: BadgeSize;
  Icon?: (params: { size: number; color: ColorValue }) => React.ReactNode;
}) {
  const t = useTheme();

  const containerStyles = useMemo(() => {
    const bgColors: Record<BadgeColor, ColorValue> = {
      primary: t.colors.bgLightPurple,
      secondary: t.dark ? '#2E2835' : '#EFEFEF',
    };

    return [
      t.flexRow,
      t.justifyCenter,
      t.itemsCenter,
      {
        paddingVertical: 3,
        paddingLeft: 6,
        paddingRight: 8,
        borderRadius: t.borderRadiuses.$40,
        backgroundColor: bgColors[color],
        gap: 4,
      },
    ];
  }, [t, color]);

  const textColor = useMemo(() => {
    const colors: Record<BadgeColor, ColorValue> = {
      primary: t.dark ? '#FFFFFF' : '#8A63D2',
      secondary: t.colors.text.secondary,
    };

    return colors[color];
  }, [t, color]);

  const iconSize = useMemo(() => {
    const sizes: Record<BadgeSize, number> = {
      xs: 12,
    };

    return sizes[size];
  }, [size]);

  const textStyles = useMemo(() => {
    return [
      {
        color: textColor,
      },
    ];
  }, [textColor]);

  return (
    <View style={containerStyles}>
      {Icon && <Icon size={iconSize} color={textColor} />}
      {!!label && (
        <Text2 weight="medium" size={badgeToTextSize[size]} style={textStyles}>
          {label}
        </Text2>
      )}
    </View>
  );
}

export function IconBadge({
  color,
  size,
  Icon,
}: {
  color: BadgeColor;
  size: BadgeSize;
  Icon: ComponentType<{ size: number; color: ColorValue }>;
}) {
  const t = useTheme();

  const containerStyles = useMemo(() => {
    const bgColors: Record<BadgeColor, ColorValue> = {
      primary: t.dark ? '#2E2835' : '#F0EDFF',
      secondary: t.dark ? '#2E2835' : '#EFEFEF',
    };

    return [
      t.flexRow,
      t.justifyCenter,
      t.itemsCenter,
      t.p1,
      t.roundedFull,
      {
        backgroundColor: bgColors[color],
      },
    ];
  }, [t, color]);

  const textColor = useMemo(() => {
    const colors: Record<BadgeColor, ColorValue> = {
      primary: t.dark ? '#FFFFFF' : '#8A63D2',
      secondary: t.colors.text.secondary,
    };

    return colors[color];
  }, [t, color]);

  const iconSize = useMemo(() => {
    const sizes: Record<BadgeSize, number> = {
      xs: 10,
    };

    return sizes[size];
  }, [size]);

  return (
    <View style={containerStyles}>
      <Icon size={iconSize} color={textColor} />
    </View>
  );
}
