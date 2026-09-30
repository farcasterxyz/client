import React, { FC } from 'react';
import { Image } from 'react-native';

type WarpLogoProps = {
  size: number;
};

const WarpLogo: FC<WarpLogoProps> = ({ size }) => (
  <Image
    source={require('~/assets/images/warp-logo.png')}
    style={{ height: size, width: size }}
    resizeMode="contain"
  />
);

WarpLogo.displayName = 'WarpLogo';

export { WarpLogo };
