import { FC, memo } from 'react';

import { Image } from '~/components/images/Image';

type WarpLogoProps = {
  size: number;
};

const WarpLogo: FC<WarpLogoProps> = memo(({ size }) => {
  return (
    <Image
      src={'/~/images/Warp.png'}
      className={'aspect-square shrink-0 object-cover bg-app'}
      style={{
        width: size,
        height: size,
      }}
      alt="Warps"
    />
  );
});

WarpLogo.displayName = 'WarpLogo';

export { WarpLogo };
