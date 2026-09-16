import React, { memo } from 'react';
import { View, ViewStyle } from 'react-native';

export type ColumnProps = {
  style?: ViewStyle;
  children: React.ReactNode;
};

export const Column = memo(({ children, style }: ColumnProps) => {
  return <View style={[{ flexDirection: 'column' }, style]}>{children}</View>;
});

Column.displayName = 'Column';
