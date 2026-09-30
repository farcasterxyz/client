import React from 'react';
import { Image, ImageStyle, StyleProp, View } from 'react-native';

import FarcasterIcon from '~/assets/images/open-graph/Farcaster.webp';
import EthereumForVerification from '~/assets/images/verifications/eth.png';
import SolanaForVerification from '~/assets/images/verifications/solana.png';
import { useTheme } from '~/contexts/ThemeProvider';

type ProtocolImageProps = {
  protocol: 'eth' | 'solana';
  style?: StyleProp<ImageStyle>;
};

export function FarcasterWalletImage() {
  const t = useTheme();
  return (
    <View
      style={[
        t.roundedFull,
        t.borderWhite,
        {
          borderWidth: 1,
          padding: 1,
          backgroundColor: t.colors.blueMarguerite,
        },
      ]}
    >
      <Image
        source={FarcasterIcon}
        style={[t.w4, t.h4, t.roundedFull, t.objectCover]}
        resizeMode="cover"
      />
    </View>
  );
}

export function ProtocolImage({ protocol, style }: ProtocolImageProps) {
  const t = useTheme();

  const protocolImageAssetUri = React.useMemo(() => {
    switch (protocol) {
      case 'eth':
        return EthereumForVerification;
      case 'solana':
        return SolanaForVerification;
    }
  }, [protocol]);

  return (
    <Image
      source={protocolImageAssetUri}
      style={[t.h7, t.w7, t.objectContain, style]}
    />
  );
}
