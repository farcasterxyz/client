import React from 'react';
import { Image, View } from 'react-native';

import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

import emptyDark from './emptyDirectCastsDark.png';
import emptyLight from './emptyDirectCastsLight.png';

export function EmptyDirectCastsInbox({
  text = 'No direct casts',
}: {
  text?: string;
}) {
  const t = useTheme();

  return (
    <View style={[t.wFull, { marginTop: 20, marginBottom: 28 }, t.itemsCenter]}>
      <View style={[{ marginBottom: 20 }]}>
        <Image
          source={t.dark ? emptyDark : emptyLight}
          style={[{ width: 178, height: 178 }]}
          resizeMode="contain"
        />
      </View>
      <Text2>{text}</Text2>
    </View>
  );
}
