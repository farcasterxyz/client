import { Image } from 'expo-image';
import {
  getCloudflareImageUrl,
  getImageAspectRatio,
} from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { imageRequestHeaders } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  manuallyFetchDimensions,
  manuallyFetchedDimension,
  ManuallySetDimensions,
} from '~/utils/ImageUtils';

type AutosizedRemoteImageWithAspectRationsProps = {
  uri: string;
  maxWidth: number;
  height: number;
  onError?: () => void;
};

const AutosizedRemoteImageWithAspectRatios: React.FC<AutosizedRemoteImageWithAspectRationsProps> =
  React.memo(({ uri, height, maxWidth, onError }) => {
    const t = useTheme();

    const finalUri = getCloudflareImageUrl({
      url: uri,
      windowWidth: maxWidth,
      blockAnimated: true,
    });

    const [dim, setDim] = React.useState<ManuallySetDimensions | undefined>(
      manuallyFetchedDimension({ uri: uri }),
    );
    const [aspectRatio, setAspectRatio] = React.useState<number>(
      dim
        ? getImageAspectRatio({
            h: Math.min(dim.height, height),
            w: Math.min(dim.width, maxWidth),
          })
        : 1,
    );

    React.useEffect(() => {
      if (typeof dim !== 'undefined') {
        return;
      }
      manuallyFetchDimensions({ uri: uri }).then((newDim) => {
        setDim(newDim);
        setAspectRatio(
          getImageAspectRatio({
            h: Math.min(newDim.height, height),
            w: Math.min(newDim.width, maxWidth),
          }),
        );
      });
    }, [dim, height, maxWidth, uri]);

    return (
      <View
        key={finalUri}
        style={[
          t.roundedLg,
          t.overflowHidden,
          {
            height,
            maxWidth,
          },
        ]}
      >
        <Image
          source={{ uri: finalUri, headers: imageRequestHeaders }}
          cachePolicy="memory-disk"
          recyclingKey={finalUri}
          style={[
            t.roundedLg,
            t.borderDefault,
            t.borderHairline,
            {
              width: '100%',
              height: '100%',
              aspectRatio: aspectRatio,
            },
          ]}
          onError={onError}
        />
      </View>
    );
  });

AutosizedRemoteImageWithAspectRatios.displayName =
  'AutosizedRemoteImageWithAspectRatios';

export { AutosizedRemoteImageWithAspectRatios };
