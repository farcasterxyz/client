import { ApiUser } from 'farcaster-client-data';
import { useGloballyCachedUser } from 'farcaster-client-hooks';
import React from 'react';

import { CastAvatar } from '~/components/casts/CastAvatar';

type DirectCastAvatarProps = {
  user: ApiUser;
  diameter: number;
};

const DirectCastAvatar: React.FC<DirectCastAvatarProps> = ({
  user,
  diameter = 24,
}) => {
  const sender = useGloballyCachedUser({ fallback: user });

  return (
    <CastAvatar
      avatarDiameter={diameter}
      user={sender}
      disabled={false}
      shouldFadeIn={false}
      allowQuickFollows={!sender.viewerContext?.following}
      useSimplerRemoteImageBase={true}
    />
  );
};

export { DirectCastAvatar };
