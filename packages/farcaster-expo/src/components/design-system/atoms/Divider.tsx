import React, { FC, memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';

type DividerProps = {
  marginVertical?: 'normal' | 'spacious' | 'none' | 'slim';
  showLine?: boolean;
  thickness?: 'normal' | 'thick';
};

const Divider: FC<DividerProps> = memo(
  ({ marginVertical = 'normal', showLine = true, thickness = 'normal' }) => {
    const t = useTheme();

    const marginStyle = useMemo(() => {
      switch (marginVertical) {
        case 'none':
          return t.mY0;
        case 'spacious':
          return t.mY8;
        case 'slim':
          return t.mY2;
        default:
          return t.mY4;
      }
    }, [marginVertical, t]);

    return (
      <View
        style={[
          showLine ? t.borderDefault : null,
          thickness === 'thick' ? t.borderB : t.borderBHairline,
          marginStyle,
        ]}
      />
    );
  },
);

Divider.displayName = 'Divider';

export { Divider };
