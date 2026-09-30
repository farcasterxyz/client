import { Image, ImageStyle } from 'expo-image';
import React from 'react';
import { ViewStyle } from 'react-native';

import { imageRequestHeaders } from '~/constants/Images';

type SimplerRemoteImageProps = {
  height: number;
  width: number;
  uri: string | undefined;
  style?: (ImageStyle & ViewStyle)[];
  recyclingKey?: string;
};

const SimplerRemoteImage: React.FC<SimplerRemoteImageProps> = React.memo(
  ({ height, width, style, uri, recyclingKey }) => {
    const source = React.useMemo(() => {
      return {
        uri,
        headers: imageRequestHeaders,
      };
    }, [uri]);

    const styleMemoized = React.useMemo(() => {
      return [
        {
          width,
          height,
        },
        style,
      ];
    }, [height, style, width]);

    return (
      <Image
        cachePolicy="memory-disk"
        recyclingKey={recyclingKey}
        source={source}
        transition={0}
        contentFit={'cover'}
        style={styleMemoized}
      />
    );
  },
);

SimplerRemoteImage.displayName = 'SimplerRemoteImage';

export { SimplerRemoteImage, type SimplerRemoteImageProps };
