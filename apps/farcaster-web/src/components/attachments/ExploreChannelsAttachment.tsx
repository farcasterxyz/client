import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import React from 'react';

import { Image } from '~/components/images/Image';
import { LinkToChannels } from '~/components/links/LinkToChannels';
import { getOpenGraphFallbackImageUrl } from '~/utils/openGraphUtils';

type ChannelAttachmentProps = {
  og: ApiOpenGraphMetadata;
};

const ExploreChannelsAttachment: React.FC<ChannelAttachmentProps> = ({
  og,
}) => {
  return (
    <div className="flex w-full flex-col rounded-lg border p-3 pt-2 border-faint">
      <LinkToChannels className="absolute inset-0" title={og.title!} />
      <div className="flex flex-row items-center">
        <Image
          alt="og"
          className="mr-1 size-5 rounded-md"
          src={getOpenGraphFallbackImageUrl({
            assetName: 'Farcaster',
            assetExtension: 'webp',
          })}
        />
        <div className="max-w-sm truncate text-sm">{og.title}</div>
      </div>
      <div className="mt-1 text-sm break-gracefully text-faint">
        {og.description}
      </div>
    </div>
  );
};

ExploreChannelsAttachment.displayName = 'ExploreChannelsAttachment';

export { ExploreChannelsAttachment };
