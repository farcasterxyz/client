import { ApiUser } from 'farcaster-client-data/src';
import { FC, memo } from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';

type AvatarSize = 'xs2' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type EmbedAvatarProps = {
  className?: string;
  size?: AvatarSize;
  user: Pick<ApiUser, 'pfp'>;
};

const EmbedAvatar: FC<EmbedAvatarProps> = memo(
  ({ className, size = 'md', user }) => {
    return (
      <AvatarImage
        className={className}
        size={size}
        imgUrl={user.pfp?.url}
        imgAlt={`Shared content`}
      />
    );
  },
);

EmbedAvatar.displayName = 'EmbedAvatar';

export { EmbedAvatar };
