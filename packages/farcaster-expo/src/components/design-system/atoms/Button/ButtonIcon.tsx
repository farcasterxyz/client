import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../../contexts/ThemeContext';
import {
  buttonHierarchyToTypographyColor,
  buttonSizeToIconSize,
} from './constants';
import { ButtonHierarchy, ButtonSize } from './types';

export type ButtonIconProps = {
  Icon: ({
    size,
    color,
  }: {
    size: number;
    color: string;
    disabled?: boolean;
  }) => React.ReactNode;
  hierarchy: ButtonHierarchy;
  disabled?: boolean;
  size: ButtonSize;
};

const ButtonIcon = ({
  Icon,
  hierarchy,
  disabled = false,
  size,
}: ButtonIconProps) => {
  const color = buttonHierarchyToTypographyColor[hierarchy];
  const t = useTheme();
  const colorValue = disabled ? t.colors.text.tertiary : t.colors.text[color];

  return (
    <View>
      {Icon({ size: buttonSizeToIconSize[size], color: colorValue, disabled })}
    </View>
  );
};

ButtonIcon.displayName = 'ButtonIcon';

export { ButtonIcon };
