import { ImageSource } from 'expo-image';
import { ApiAssetCollection } from 'farcaster-client-data';
import React, { FC } from 'react';

import { RemoteImage } from '~/components/RemoteImage';
import { useTheme } from '~/contexts/ThemeProvider';

const NFT_IMAGE_UNAVAILABLE_SOURCE: ImageSource = {
  uri: 'https://farcaster.xyz/nft.png',
};

type CollectionImageProps = {
  collection: Pick<ApiAssetCollection, 'imageUrl'>;
  size?: 'default' | 'small' | 'large' | 'tiny';
};

const CollectionImage: FC<CollectionImageProps> = ({
  collection,
  size = 'default',
}) => {
  const t = useTheme();

  const dimension = React.useMemo(() => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 48;
      case 'tiny':
        return 14;
      case 'default':
      default:
        return 18;
    }
  }, [size]);

  return (
    <RemoteImage
      contentFit="cover"
      uri={collection.imageUrl}
      width={dimension}
      height={dimension}
      style={[t.roundedSm, t.mR1]}
      fallbackSource={NFT_IMAGE_UNAVAILABLE_SOURCE}
      shouldFadeIn={false}
    />
  );
};

CollectionImage.displayName = 'CollectionImage';

export { CollectionImage, NFT_IMAGE_UNAVAILABLE_SOURCE };
