import { getSpecificallySizedImageUrl } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { PixelRatio, Platform, View } from 'react-native';

import { NFT_IMAGE_UNAVAILABLE_SOURCE } from '~/components/CollectionImage';
import { RemoteImage } from '~/components/RemoteImage';
import { useTheme } from '~/contexts/ThemeProvider';

import { SimplerRemoteImage } from './SimplerRemoteImage';

type FeedImageProps = {
  size: number;
  imageUrl?: string;
  iconSize?: number;
  iconColor?: string;
  iconBackgroundColor?: string;
  dimmed?: boolean;
};

const FeedImage: FC<FeedImageProps> = memo(({ size, imageUrl, dimmed }) => {
  const t = useTheme();

  const optimizedImageUrl = React.useMemo(() => {
    if (typeof imageUrl === 'undefined') {
      return imageUrl;
    }

    const dpr = Math.min(PixelRatio.get(), Platform.OS === 'ios' ? 3 : 2);
    const px = PixelRatio.getPixelSizeForLayoutSize(size);
    const s = PixelRatio.roundToNearestPixel(px * (dpr / PixelRatio.get()));

    return getSpecificallySizedImageUrl({
      staticRaster: imageUrl,
      h: s,
      w: s,
    });
  }, [imageUrl, size]);

  if (optimizedImageUrl) {
    return (
      <SimplerRemoteImage
        uri={optimizedImageUrl}
        height={size}
        width={size}
        style={[t.borderDefault, t.borderHairline, t.roundedFull]}
        recyclingKey={optimizedImageUrl}
      />
    );
  }

  return (
    <View
      style={[
        t.roundedFull,
        t.borderDefault,
        t.borderHairline,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <RemoteImage
        contentFit="cover"
        width={size - 1}
        height={size - 1}
        uri={imageUrl}
        recyclingKey={imageUrl}
        cachePolicy="memory-disk"
        style={[t.roundedFull, dimmed ? { opacity: 0.7 } : undefined]}
        fallbackSource={NFT_IMAGE_UNAVAILABLE_SOURCE}
        shouldFadeIn={true}
      />
    </View>
  );
});

FeedImage.displayName = 'FeedImage';

export { FeedImage };
