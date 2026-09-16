import { Image } from 'expo-image';
import { ApiTokenSourcePlatform } from 'farcaster-client-data';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';

import Bonk from '../../../assets/platforms/bonk.svg';
import Clanker from '../../../assets/platforms/clanker.svg';
import HeavenDark from '../../../assets/platforms/heaven-dark.svg';
import HeavenLight from '../../../assets/platforms/heaven-light.svg';
import PumpFun from '../../../assets/platforms/pumpfun.svg';
import { useTheme } from '../../../contexts';

const Zora = require('../../../assets/platforms/zora.webp');
const Paragraph = require('../../../assets/platforms/paragraph.webp');

const PLATFORM_IMAGES: Record<
  Exclude<ApiTokenSourcePlatform, 'zora' | 'paragraph' | 'base-solana-bridge'>,
  { light: React.FC<SvgProps>; dark: React.FC<SvgProps> }
> = {
  clanker: { light: Clanker, dark: Clanker },
  pumpfun: { light: PumpFun, dark: PumpFun },
  bonk: { light: Bonk, dark: Bonk },
  heaven: { light: HeavenLight, dark: HeavenDark },
};

export function TokenPlatformIcon({
  platform,
  style,
  size = 14,
}: {
  platform?: ApiTokenSourcePlatform;
  style?: StyleProp<ViewStyle>;
  size?: number;
}) {
  const t = useTheme();

  if (!platform) {
    return null;
  }

  if (platform === 'zora') {
    return (
      <Image
        source={Zora}
        cachePolicy="memory-disk"
        style={[t.roundedFull, { width: size, height: size }, style]}
      />
    );
  } else if (platform === 'paragraph') {
    return (
      <Image
        source={Paragraph}
        cachePolicy="memory-disk"
        style={[t.roundedSm, { width: size, height: size }, style]}
      />
    );
  } else if (platform === 'base-solana-bridge') {
    return null;
  }

  const PlatformIcons = PLATFORM_IMAGES[platform];
  if (!PlatformIcons) {
    return null;
  }

  const PlatformIcon = t.dark ? PlatformIcons.dark : PlatformIcons.light;

  return (
    <PlatformIcon width={size} height={size} style={[t.roundedFull, style]} />
  );
}
