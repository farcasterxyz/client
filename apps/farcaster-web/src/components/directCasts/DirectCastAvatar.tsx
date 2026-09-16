import { ApiUser } from 'farcaster-client-data';
import { useGloballyCachedUser } from 'farcaster-client-hooks';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { AvatarImageProps } from '~/components/avatar/AvatarImage';

type DirectCastAvatarProps = {
  user: ApiUser;
  className: string;
  hide?: boolean;
  size?: AvatarImageProps['size'];
};

const DirectCastAvatar: React.FC<DirectCastAvatarProps> = ({
  user,
  className,
  hide,
  size = 'md',
}) => {
  const sender = useGloballyCachedUser({ fallback: user });

  return (
    <Avatar
      user={hide ? ({} as ApiUser) : sender}
      size={size}
      hideFollowButton={false}
      className={className}
      style={{
        opacity: hide ? 0 : undefined,
        height: hide ? 0 : undefined,
        minHeight: hide ? 0 : undefined,
      }}
    />
  );
};

export { DirectCastAvatar };
