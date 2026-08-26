import { useUserByUsername } from 'farcaster-client-hooks';
import { memo } from 'react';

import { ProfileLikes } from '~/components/profiles/ProfileLikes';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileLikesWithUsernamePage = memo(() => {
  const { username } = useParams('profileLikesWithUsername');

  const { result: userProfile } = useUserByUsername({ username }).data!;

  return <ProfileLikes userProfile={userProfile} />;
});

ProfileLikesWithUsernamePage.displayName = 'ProfileLikesWithUsernamePage';

export { ProfileLikesWithUsernamePage };
