import { ApiCastChannelTag } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { CollectionNameWithImage } from '~/components/collections/CollectionNameWithImage';

type CastChannelTagProps = {
  tag: ApiCastChannelTag;
};

const CastChannelTag: FC<CastChannelTagProps> = memo(({ tag }) => {
  return (
    <div className="mb-0.5 w-max rounded-md border p-1 border-default sm:px-1 sm:py-0">
      <CollectionNameWithImage
        name={tag.name}
        imageUrl={tag.imageUrl}
        disableHoverUnderline={true}
      />
    </div>
  );
});

CastChannelTag.displayName = 'CastChannelTag';

export { CastChannelTag };
