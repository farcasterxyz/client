import React, { FC, memo } from 'react';
import { ActivityIndicator, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';

type LoadingIndicatorProps = {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle | ViewStyle[];
};

const LoadingIndicator: FC<LoadingIndicatorProps> = memo(
  ({ size = 'small', color, style }) => {
    const t = useTheme();

    return (
      <ActivityIndicator
        size={size}
        color={color || t.colors.loadingIndicator}
        style={style}
      />
    );
  },
);

LoadingIndicator.displayName = 'LoadingIndicator';

export { LoadingIndicator };
