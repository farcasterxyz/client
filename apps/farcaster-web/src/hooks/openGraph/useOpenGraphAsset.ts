import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import { useMemo } from 'react';

import {
  getOpenGraphFallbackAssetName,
  getOpenGraphFallbackImageUrl,
  getOpenGraphImageProps,
  getOpenGraphImageSource,
  getShouldForceFallbackAsset,
} from '~/utils/openGraphUtils';

const useOpenGraphAsset = ({
  attachment,
  didImageFailToLoad,
}: {
  attachment: ApiOpenGraphMetadata;
  didImageFailToLoad: boolean;
}) => {
  return useMemo(() => {
    const imageSource = getOpenGraphImageSource({ attachment });
    const shouldUseFallbackAsset = !!(
      didImageFailToLoad ||
      !imageSource ||
      getShouldForceFallbackAsset({ attachment })
    );

    const imageProps = shouldUseFallbackAsset
      ? {
          src: getOpenGraphFallbackImageUrl({
            assetName: getOpenGraphFallbackAssetName({ attachment }),
          }),
        }
      : getOpenGraphImageProps({ attachment });

    return { imageProps };
  }, [attachment, didImageFailToLoad]);
};

export { useOpenGraphAsset };
