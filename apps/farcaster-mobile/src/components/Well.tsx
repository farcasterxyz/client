import React from 'react';
import { View, ViewProps } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

export interface WellProps extends ViewProps {}

export function Well({ style, children, ...rest }: WellProps) {
  const t = useTheme();

  return (
    <View style={[style, t.bgElevated, t.p4, t.roundedLg]} {...rest}>
      {children}
    </View>
  );
}
