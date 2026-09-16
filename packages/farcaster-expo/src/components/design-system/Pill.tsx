import React, { FC, ReactNode, useMemo } from 'react';
import { Pressable, TextStyle, View, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { Text2 } from './Text';

type PillSize = 'sm' | 'md';

type PillContainerProps = {
  children: ReactNode;
  variant: 'inactive' | 'active';
  onPress?: () => void;
  size?: PillSize;
};

type PillTextProps = {
  children: ReactNode;
  variant: 'inactive' | 'active';
  size?: PillSize;
};

const PillContainer: FC<PillContainerProps> = ({
  children,
  variant,
  onPress,
  size = 'md',
}) => {
  const t = useTheme();

  const containerStyle = useMemo(() => {
    const baseStyle: ViewStyle[] = [
      size !== 'sm' && t.h8,
      size !== 'sm' && {
        minWidth: 80,
      },
      size === 'sm' && t.pY1,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      t.justifyCenter,
      t.border,
      size === 'sm' ? t.pX2 : t.pX4,
      {
        borderRadius: 50,
      },
    ];

    // Variant variations
    switch (variant) {
      case 'inactive':
        baseStyle.push({
          backgroundColor: t.colors.background.secondary,
          borderColor: t.colors.background.secondary,
        });
        break;
      case 'active':
        baseStyle.push({
          backgroundColor: t.dark
            ? t.colors.background.tertiary
            : t.colors.background.brandLight,
          borderColor: t.dark
            ? t.colors.background.tertiary
            : t.colors.background.brandLight,
        });
        break;
    }
    return baseStyle;
  }, [
    size,
    t.h8,
    t.pY1,
    t.flex,
    t.flexRow,
    t.itemsCenter,
    t.justifyCenter,
    t.border,
    t.pX2,
    t.pX4,
    t.colors.background.secondary,
    t.colors.background.tertiary,
    t.colors.background.brandLight,
    t.dark,
    variant,
  ]);

  return (
    <Pressable onPress={onPress}>
      <View style={containerStyle}>{children}</View>
    </Pressable>
  );
};

const PillText: FC<PillTextProps> = ({ children, variant, size = 'md' }) => {
  const t = useTheme();

  const textStyle = useMemo(() => {
    const baseStyle: TextStyle[] = [
      size === 'sm' ? t.fontMedium : t.fontSemibold,
      {
        fontSize: size === 'sm' ? 12 : 14,
        lineHeight: size === 'sm' ? 16 : 18,
      },
    ];

    // Variant variations
    switch (variant) {
      case 'active':
        baseStyle.push({
          color: t.dark ? t.colors.text.white : t.colors.text.brand,
        });
        break;
      case 'inactive':
        baseStyle.push({
          color: t.colors.text.secondary,
        });
        break;
    }

    return baseStyle;
  }, [
    size,
    t.fontMedium,
    t.fontSemibold,
    t.dark,
    t.colors.text.white,
    t.colors.text.brand,
    t.colors.text.secondary,
    variant,
  ]);

  return <Text2 style={textStyle}>{children}</Text2>;
};

type PillProps = {
  children: string;
  variant: 'inactive' | 'active';
  size?: PillSize;
  onPress?: () => void;
};

const Pill: FC<PillProps> & {
  Container: typeof PillContainer;
  Text: typeof PillText;
} = ({ children, variant, onPress, size = 'md' }) => {
  return (
    <PillContainer variant={variant} onPress={onPress} size={size}>
      <PillText variant={variant} size={size}>
        {children}
      </PillText>
    </PillContainer>
  );
};

// Attach Container and Text as properties
Pill.Container = PillContainer;
Pill.Text = PillText;

export { Pill };
