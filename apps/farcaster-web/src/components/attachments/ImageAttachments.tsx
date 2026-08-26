import { ApiCastEmbeds, ApiMediaV2 } from 'farcaster-client-data';
import React from 'react';

import { ImageAttachmentGroup } from './ImageAttachmentGroup';

type ImageAttachmentsProps = {
  images: ApiCastEmbeds['images'];
  height?: number;
  width?: number;
  maxWidth?: number;
  ignoreAspectRatio: boolean;
  carouselIndex?: number;
  noShrink?: boolean;
  snapContext?: boolean;
};

const ImageAttachments: React.FC<ImageAttachmentsProps> = ({
  images,
  height,
  width,
  maxWidth,
  ignoreAspectRatio,
  carouselIndex,
  noShrink,
  snapContext = false,
}) => {
  const ImageAttachmentsComponent = React.useMemo(() => {
    if (images.length === 0) {
      return <></>;
    }

    const mediaImageEmbeds = images.map((image) => {
      if (typeof image.media !== 'undefined') {
        return image.media as ApiMediaV2;
      }

      return {
        version: '2',
        staticRaster: image.url,
        height: 1000,
        width: 1000,
      } satisfies ApiMediaV2;
    });

    return (
      <ImageAttachmentGroup
        medias={mediaImageEmbeds}
        height={height}
        width={width}
        maxWidth={maxWidth}
        ignoreAspectRatio={ignoreAspectRatio}
        carouselIndex={carouselIndex}
        noShrink={noShrink}
        snapContext={snapContext}
      />
    );
  }, [
    carouselIndex,
    height,
    ignoreAspectRatio,
    images,
    maxWidth,
    noShrink,
    snapContext,
    width,
  ]);

  return <>{ImageAttachmentsComponent}</>;
};

ImageAttachments.displayName = 'ImageAttachments';

export { ImageAttachments };
