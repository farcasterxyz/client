import cn from 'classnames';
import { FC, memo, useMemo } from 'react';

import { Image } from '~/components/images/Image';
import {
  defaultAvatarUrl,
  lg2AvatarDiameter,
  lgAvatarDiameter,
  mdAvatarDiameter,
  sm1AvatarDiameter,
  sm2AvatarDiamater,
  smAvatarDiameter,
  xl2AvatarDiameter,
  xlAvatarDiameter,
  xs2AvatarDiameter,
  xsAvatarDiameter,
} from '~/constants/avatar';
import { applyCloudflarePath } from '~/utils/images';

type AvatarSize =
  | 'xs2'
  | 'xs'
  | '24'
  | 'sm'
  | 'sm1'
  | 'sm2'
  | 'md'
  | 'lg'
  | 'lg2'
  | 'xl'
  | 'xlx'
  | 'xl2';

type AvatarImageProps = {
  className?: string;
  style?: React.CSSProperties;
  size?: AvatarSize;
  imgUrl?: string;
  imgAlt: string;
  loading?: HTMLImageElement['loading'];
  priority?: boolean;
};

const AvatarImage: FC<AvatarImageProps> = memo(
  ({ className, size = 'md', imgUrl, imgAlt, loading, priority, style }) => {
    const { length } = useMemo(() => {
      switch (size) {
        case 'xs2':
          return {
            length: xs2AvatarDiameter,
          };
        case 'sm1': {
          return {
            length: sm1AvatarDiameter,
          };
        }
        case 'xs':
          return {
            length: xsAvatarDiameter,
          };
        case 'sm':
          return {
            length: smAvatarDiameter,
          };
        case 'sm2':
          return {
            length: sm2AvatarDiamater,
          };
        case 'md':
          return {
            length: mdAvatarDiameter,
          };
        case 'lg':
          return {
            length: lgAvatarDiameter,
          };
        case 'lg2':
          return {
            length: lg2AvatarDiameter,
          };
        case 'xl2':
          return {
            length: xl2AvatarDiameter,
          };
        default:
          return {
            length: xlAvatarDiameter,
          };
      }
    }, [size]);

    const src = useMemo(() => {
      if (typeof imgUrl === 'undefined') {
        return applyCloudflarePath(defaultAvatarUrl, length);
      }

      return applyCloudflarePath(imgUrl, length * 2);
    }, [imgUrl, length]);

    return (
      <Image
        src={src}
        className={cn(
          'aspect-square shrink-0 rounded-full border object-cover bg-app border-default',
          className,
        )}
        style={{
          width: length,
          height: length,
          minWidth: length,
          minHeight: length,
          ...style,
        }}
        alt={imgAlt}
        fallback={defaultAvatarUrl}
        loading={loading}
        priority={priority}
      />
    );
  },
);

AvatarImage.displayName = 'AvatarImage';

export { AvatarImage, type AvatarImageProps };
