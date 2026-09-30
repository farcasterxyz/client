import React, { memo } from 'react';
import { View, ViewStyle } from 'react-native';

export type RowProps = {
  style?: ViewStyle;
  children: React.ReactNode;
};

export const Row = memo(({ children, style }: RowProps) => {
  return <View style={[{ flexDirection: 'row' }, style]}>{children}</View>;
});

Row.displayName = 'Row';
