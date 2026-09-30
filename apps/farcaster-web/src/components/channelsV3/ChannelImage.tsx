import classNames from 'classnames';
import { getSpecificallySizedImageUrl } from 'farcaster-client-hooks';
import React from 'react';

import { Image } from '~/components/images/Image';
import { defaultAvatarUrl } from '~/constants/avatar';

import { ChannelTagSize } from './ChannelTagSize';

type ChannelImageProps = {
  channelImageUrl: string | undefined;
  size: ChannelTagSize | '108';
};

const ChannelImage: React.FC<ChannelImageProps> = React.memo(
  ({ channelImageUrl, size }) => {
    const diameter = React.useMemo(() => {
      switch (size) {
        case 'feed':
          return 16;
        case '108':
          return 108;
        case 'composer-selector-large':
        case 'notification':
          return 40;
        case 'composer-quick-selector':
          return 20;
        case 'channel-headers':
          return 96;
        case 'conversation-header':
        default:
          return 16;
      }
    }, [size]);

    const src = React.useMemo(() => {
      return getSpecificallySizedImageUrl({
        staticRaster: channelImageUrl || defaultAvatarUrl,
        h: diameter,
        w: diameter,
      });
    }, [channelImageUrl, diameter]);

    return (
      <Image
        src={src}
        style={{ width: diameter, height: diameter, aspectRatio: 1 }}
        className={classNames('rounded-full object-cover')}
        alt={'Channel image'}
      />
    );
  },
);

ChannelImage.displayName = 'ChannelImage';

export { ChannelImage };
