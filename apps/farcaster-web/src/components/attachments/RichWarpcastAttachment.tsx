import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import React from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';

type RichWarpcastAttachmentProps = {
  og: ApiOpenGraphMetadata;
  disabled: boolean;
};

const RichWarpcastAttachment: React.FC<RichWarpcastAttachmentProps> = ({
  og,
  disabled,
}) => {
  return (
    <div className="relative flex w-full flex-col items-center rounded-lg border border-default">
      {!disabled && (
        <ExternalLink
          className="absolute inset-0 subtle-hover-z"
          href={og.url}
          title={og.url}
        />
      )}
      <Image
        alt="Starter pack"
        className="max-h-[300px] w-full rounded-t-lg object-cover object-left-top"
        src={og.image || NFT_IMAGE_UNAVAILABLE_URL}
        style={{ aspectRatio: 1.91 }}
      />
      <div className="flex w-full flex-col rounded-b-lg border-t p-2 text-sm bg-app border-default text-default">
        <div className="font-semibold">{og.title}</div>
        <div className="text-faint">{og.description}</div>
      </div>
    </div>
  );
};

export { RichWarpcastAttachment };
