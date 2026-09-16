import { XIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { getImageAspectRatio } from 'farcaster-client-hooks';
import React from 'react';

import { LocallyProbedImage } from '~/components/composer/context/OptimisticMediaEmbedsProvider';
import { Image } from '~/components/images/Image';

type ComposerImageAttachmentProps = {
  image: LocallyProbedImage;
  isUploading?: boolean;
  onRemove: () => void;
};

const ComposerImageAttachment: React.FC<ComposerImageAttachmentProps> = ({
  image,
  isUploading = false,
  onRemove,
}) => {
  return (
    <div
      className={classNames(
        'relative overflow-hidden rounded-[12px] border border-default',
        isUploading && 'animate-pulse',
      )}
    >
      <div
        className="absolute right-0 top-0 z-10 mr-2 mt-2 flex cursor-pointer justify-center rounded-full p-1 bg-overlay"
        onClick={onRemove}
      >
        <XIcon size={18} className="font-semibold text-white" />
      </div>
      {isUploading && (
        <div className="absolute left-0 top-0 z-10 ml-2 mt-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-white bg-overlay">
          <div className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Uploading
        </div>
      )}
      <Image
        className={classNames(
          'relative h-full max-h-[300px] w-auto origin-center cursor-pointer object-cover',
        )}
        style={{ aspectRatio: getImageAspectRatio({ w: image.w, h: image.h }) }}
        src={image.src}
        alt={'Cast image embed'}
        loading="lazy"
      />
    </div>
  );
};

export { ComposerImageAttachment };
