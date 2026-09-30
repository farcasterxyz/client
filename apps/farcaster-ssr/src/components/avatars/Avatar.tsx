import { ApiUser } from 'farcaster-client-data';
import { FC } from 'react';

import { LinkToProfile } from '~/components/links/LinkToProfile';

type AvatarProps = {
  user: ApiUser;
};

const Avatar: FC<AvatarProps> = ({ user }) => {
  if (!user.pfp) {
    return null;
  }

  return (
    <LinkToProfile user={user}>
      <img alt={`${user.displayName} pfp`} src={user.pfp.url} width={64} />
    </LinkToProfile>
  );
};

Avatar.displayName = 'Avatar';

export { Avatar };
