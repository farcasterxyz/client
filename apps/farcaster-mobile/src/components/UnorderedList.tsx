import React, { ReactNode } from 'react';
import { View } from 'react-native';

import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export function UnorderedListItem({ children }: { children: ReactNode }) {
  const t = useTheme();

  return (
    <View style={[t.flexRow]}>
      <Text2 weight="bold" style={[t.flexNone, t.mX3]}>
        {'\u2022'}
      </Text2>
      <View style={[t.flexShrink]}>{children}</View>
    </View>
  );
}
