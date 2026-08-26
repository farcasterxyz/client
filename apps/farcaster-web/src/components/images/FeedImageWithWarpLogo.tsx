import cn from 'classnames';
import { FC, memo } from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Image } from '~/components/images/Image';
import { Warp } from '~/components/warps/Warp';
import { applyCloudflarePath } from '~/utils/images';

type FeedImageWithWarpLogoProps = {
  imageUrl?: string;
  channelName: string;
  className?: string;
};

const FeedImageWithWarpLogo: FC<FeedImageWithWarpLogoProps> = memo(
  ({ imageUrl, channelName, className }) => {
    return (
      <div className={cn(className, 'relative')}>
        <Image
          src={applyCloudflarePath(imageUrl, 48) || NFT_IMAGE_UNAVAILABLE_URL}
          className="aspect-square size-[48px] shrink-0 rounded-full object-cover"
          alt={`${channelName} image`}
          fallback={NFT_IMAGE_UNAVAILABLE_URL}
        />
        <div className="absolute left-[30px] top-[30px] flex size-[24px] flex-col items-center justify-center rounded-full border-2 bg-action border-app">
          <Warp size={14} className="text-white" />
        </div>
      </div>
    );
  },
);

FeedImageWithWarpLogo.displayName = 'FeedImageWithWarpLogo';

export { FeedImageWithWarpLogo };
