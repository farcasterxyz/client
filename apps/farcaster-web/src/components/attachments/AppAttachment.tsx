import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import React from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Image } from '~/components/images/Image';

type AppAttachmentProps = {
  og: ApiOpenGraphMetadata;
  disabled: boolean;
};

const AppAttachment: React.FC<AppAttachmentProps> = ({ og }) => {
  return (
    <div className="relative flex w-full flex-row items-center rounded-lg">
      <Image
        alt="App image"
        className="h-24 w-[88px] min-w-[88px] rounded-l-lg border border-faint"
        src={og.image || NFT_IMAGE_UNAVAILABLE_URL}
      />
      <div className="flex h-24 flex-1 flex-col justify-center rounded-lg rounded-l-none border border-l-0 p-2 border-faint">
        <div className="flex flex-row space-x-1">
          <span className="text-sm font-semibold text-default">{og.title}</span>
        </div>
        <span className="text-sm text-faint">{og.description}</span>
      </div>
    </div>
  );
};

export { AppAttachment };
