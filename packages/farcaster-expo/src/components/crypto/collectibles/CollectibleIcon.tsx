import React from 'react';

import { RemoteImage } from '../../../components/RemoteImage';
import { useTheme } from '../../../contexts/ThemeContext';

interface NftItemProps {
  imageUrl: string;
  imageSize: number;
  dangerouslyAllowAnimation?: boolean;
}

export function CollectibleIcon({
  imageUrl,
  imageSize,
  dangerouslyAllowAnimation,
}: NftItemProps) {
  const t = useTheme();

  return (
    <RemoteImage
      uri={imageUrl}
      recyclingKey={imageUrl}
      style={[
        t.roundedLg,
        t.overflowHidden,
        {
          width: imageSize,
          height: imageSize,
          backgroundColor: t.colors.bgFaint,
        },
      ]}
      contentFit="cover"
      dangerouslyAllowAnimation={dangerouslyAllowAnimation}
      shouldAttemptToUncloudifyOnError={true}
      // TODO: Remove this once we migrate off of Helius for NFTs
      dangerouslySkipCloudinary={imageUrl.includes('helius')}
    />
  );
}
