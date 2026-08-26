import React, { FC } from 'react';

import FarcasterArch from '~/assets/images/farcaster-arch.svg';

type LogoFullProps = {
  size: number;
};

const LogoFull: FC<LogoFullProps> = ({ size }) => (
  <FarcasterArch style={{ height: size, width: size }} resizeMode="contain" />
);

LogoFull.displayName = 'LogoFull';

export { LogoFull };
