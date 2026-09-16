import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { ButtonContainer } from './ButtonContainer';
import { ButtonContent } from './ButtonContent';
import { ButtonIcon } from './ButtonIcon';
import { ButtonText } from './ButtonText';
import type { ButtonHierarchy, ButtonSize } from './types';

export type ButtonProps = {
  children?: React.ReactNode;
  Icon?: ({ size, color }: { size: number; color: string }) => React.ReactNode;
  onPress?: () => void;
  size?: ButtonSize;
  hierarchy?: ButtonHierarchy;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * This component is expected to directly match the figma design system, specifically the button component - https://www.figma.com/design/cbmEw3b9rSiSU1cB0SpcVg/Beacon?node-id=210-3845&m=dev
 */
const Button = ({
  children,
  Icon,
  onPress,
  size = 's',
  hierarchy = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) => {
  return (
    <ButtonContainer
      onPress={onPress}
      hasIcon={!!Icon}
      hasText={!!children}
      size={size}
      hierarchy={hierarchy}
      disabled={disabled}
      style={style}
    >
      <ButtonContent loading={loading} hierarchy={hierarchy}>
        {Icon && (
          <ButtonIcon
            Icon={Icon}
            hierarchy={hierarchy}
            disabled={disabled}
            size={size}
          />
        )}
        {children && (
          <ButtonText size={size} hierarchy={hierarchy} disabled={disabled}>
            {children}
          </ButtonText>
        )}
      </ButtonContent>
    </ButtonContainer>
  );
};

Button.displayName = 'Button';
Button.Icon = ButtonIcon;
Button.Text = ButtonText;
Button.Content = ButtonContent;
Button.Container = ButtonContainer;

export { Button as AtomsButton };
