import { ApiCast, ApiUser } from 'farcaster-client-data';
import { FC } from 'react';

import { Cast } from '~/components/casts/Cast';
import { ProfileHeader } from '~/components/profiles/ProfileHeader';

import { ProfileCastsAndRepliesHead } from './ProfileCastsAndRepliesHead';

type ProfileCastsAndRepliesProps = {
  casts: ApiCast[];
  user: ApiUser;
};

const ProfileCastsAndReplies: FC<ProfileCastsAndRepliesProps> = ({
  casts,
  user,
}) => {
  return (
    <>
      <ProfileCastsAndRepliesHead user={user} casts={casts} />
      <ProfileHeader user={user} />
      <div>
        {casts.map((cast) => (
          <Cast key={cast.hash} cast={cast} />
        ))}
      </div>
    </>
  );
};

ProfileCastsAndReplies.displayName = 'ProfileCastsAndReplies';

export { ProfileCastsAndReplies };
