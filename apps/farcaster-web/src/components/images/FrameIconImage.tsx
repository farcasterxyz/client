import cn from 'classnames';
import React, { useMemo } from 'react';

import { Image } from '~/components/images/Image';
import { defaultAvatarUrl } from '~/constants/avatar';

interface FrameIconImageProps {
  imageUrl: string;
  size: 16 | 24 | 32 | 40 | 44 | 48 | 72;
}

const FrameIconImage: React.FC<FrameIconImageProps> = ({ imageUrl, size }) => {
  const borderRadius: number = useMemo(() => size / 5, [size]);

  return (
    <div
      className={cn('overflow-hidden', 'border border-default')}
      style={{ borderRadius, width: size, height: size }}
    >
      <Image
        src={imageUrl}
        alt="Frame icon"
        className="aspect-square object-cover bg-app"
        style={{
          width: size - 2,
          height: size - 2,
          minWidth: size - 2,
          minHeight: size - 2,
        }}
        fallback={defaultAvatarUrl}
      />
    </div>
  );
};
FrameIconImage.displayName = 'FrameIconImage';

export { FrameIconImage };
