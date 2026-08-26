import { getSpecificallySizedImageUrl } from 'farcaster-client-hooks';
import React from 'react';

import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { defaultAvatarUrl } from '~/constants/Avatar';
import { useTheme } from '~/contexts/ThemeProvider';

import { ChannelTagSize } from './ChannelTagSize';

type ChannelRemoteImageProps = {
  channelImageUrl: string | undefined;
  size: ChannelTagSize;
};

const ChannelRemoteImage: React.FC<ChannelRemoteImageProps> = React.memo(
  ({ channelImageUrl, size }) => {
    const t = useTheme();

    const diameter = React.useMemo(() => {
      switch (size) {
        case 'feed':
          return 15;
        case 'composer-selector-large':
        case 'threads':
        case 'composer-quick-selector':
          return 20;
        default:
          return 16;
      }
    }, [size]);

    const uri = React.useMemo(() => {
      return getSpecificallySizedImageUrl({
        staticRaster: channelImageUrl || defaultAvatarUrl,
        h: diameter,
        w: diameter,
      });
    }, [channelImageUrl, diameter]);

    const channelImageRemoteImageStyle = React.useMemo(() => {
      return [{ height: diameter, width: diameter }, t.roundedFull];
    }, [diameter, t.roundedFull]);

    return (
      <SimplerRemoteImage
        recyclingKey={uri}
        uri={uri}
        height={diameter}
        width={diameter}
        style={channelImageRemoteImageStyle}
      />
    );
  },
);

ChannelRemoteImage.displayName = 'ChannelRemoteImage';

export { ChannelRemoteImage };
