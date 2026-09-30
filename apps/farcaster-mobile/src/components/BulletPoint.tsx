import { useTheme } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

export function BulletPoint() {
  const t = useTheme();

  return (
    <View style={[t.flex, t.itemsCenter, t.justifyCenter, t.w4, t.h4, t.mR2]}>
      <View
        style={[
          t.roundedFull,
          {
            height: 6,
            width: 6,
            backgroundColor: t.colors.text.primary,
          },
        ]}
      />
    </View>
  );
}
