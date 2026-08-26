import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';

type CardVariant = 'default' | 'secondary' | 'primary-gradient';

type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
};

const OuterContainer = ({
  children,
  variant,
  style,
}: {
  children: React.ReactNode;
  variant: CardVariant;
  style?: ViewStyle;
}) => {
  const t = useTheme();
  const sharedStyles = [t.p3, { borderRadius: t.borderRadiuses.$20 }];
  if (variant === 'primary-gradient') {
    return (
      <LinearGradient
        colors={t.colors.gradients.primaryCard}
        locations={[0.0371, 0.2958]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.4125 }}
        style={[sharedStyles, t.border, t.borders.primary, style]}
      >
        {children}
      </LinearGradient>
    );
  }
  const backgroundStyle =
    variant === 'default'
      ? t.backgrounds.default
      : variant === 'secondary'
        ? t.backgrounds.secondary
        : undefined;
  return <View style={[sharedStyles, backgroundStyle, style]}>{children}</View>;
};

const Card = ({ children, variant = 'default', style }: CardProps) => {
  return (
    <OuterContainer variant={variant} style={style}>
      {children}
    </OuterContainer>
  );
};

Card.OuterContainer = OuterContainer;

export { Card };
