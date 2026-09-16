import { Image } from 'expo-image';
import * as React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';

const WalletIntroImage = require('./IntroWalletLogo.webp');

export function WalletIntroIcon({
  style,
  height = 24,
  width = 26.5,
}: {
  style?: StyleProp<ViewStyle>;
  height?: number;
  width?: number;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        t.p4,
        t.bgLightPurple,
        t.selfStart,
        style,
        t.itemsCenter,
        t.justifyCenter,
        { borderRadius: 24 },
      ]}
    >
      <Image
        source={WalletIntroImage}
        alt={'Transaction with the Farcaster Wallet'}
        style={[{ height, width }]}
      />
    </View>
  );
}
