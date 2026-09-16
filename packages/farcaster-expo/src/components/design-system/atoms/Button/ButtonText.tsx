import React, { memo } from 'react';

import { Typography } from '../Typography';
import {
  buttonHierarchyToTypographyColor,
  buttonSizeToTypographySize,
} from './constants';
import type { ButtonHierarchy, ButtonSize } from './types';

export type ButtonTextProps = {
  children: React.ReactNode;
  hierarchy: ButtonHierarchy;
  size: ButtonSize;
  disabled?: boolean;
};

const ButtonText = memo(
  ({ size, hierarchy, children, disabled = false }: ButtonTextProps) => {
    const label = buttonSizeToTypographySize[size];
    const color = disabled
      ? 'tertiary'
      : buttonHierarchyToTypographyColor[hierarchy];

    return (
      <Typography
        label={label}
        color={color}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {children}
      </Typography>
    );
  },
);

ButtonText.displayName = 'ButtonText';

export { ButtonText };
