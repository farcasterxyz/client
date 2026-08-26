import cn from 'classnames';
import { FC, memo } from 'react';

import { Image } from '~/components/images/Image';

const NFT_IMAGE_UNAVAILABLE_URL = 'https://farcaster.xyz/nft.png';

type CollectionNameWithImageProps = {
  name: string;
  imageUrl: string;
  disableHoverUnderline?: boolean;
};

const CollectionNameWithImage: FC<CollectionNameWithImageProps> = memo(
  ({ name, imageUrl, disableHoverUnderline = false }) => {
    return (
      <div className="flex flex-row items-center justify-start">
        <Image
          src={imageUrl}
          className={cn('rounded-xs aspect-square shrink-0 object-cover')}
          style={{
            width: 17,
            height: 17,
            minWidth: 17,
            minHeight: 17,
          }}
          alt={`${name} image`}
          fallback={NFT_IMAGE_UNAVAILABLE_URL}
        />
        <span
          className={cn(
            `ml-1 line-clamp-1 inline max-w-[300px] px-1 pt-[1px] text-md text-muted decoration-[#546473]`,
            !disableHoverUnderline && 'hover:underline',
          )}
        >
          {name}
        </span>
      </div>
    );
  },
);

CollectionNameWithImage.displayName = 'CollectionNameWithImage';

export { CollectionNameWithImage, NFT_IMAGE_UNAVAILABLE_URL };
