import React from 'react';
import { ColorValue, View } from 'react-native';

import { useTheme } from '../../contexts';
import { Text2 } from './Text';

export function HeaderListItem({
  Icon,
  title,
}: {
  Icon: (opts: { size: number; color: ColorValue }) => React.ReactNode;
  title: string;
}) {
  const t = useTheme();

  return (
    <View style={[t.flexRow, t.itemsCenter, t.pT3, t.pX3, { gap: 8 }]}>
      {Icon({ size: 16, color: t.colors.text.secondary })}
      <Text2 color="secondary" weight="medium">
        {title}
      </Text2>
    </View>
  );
}
