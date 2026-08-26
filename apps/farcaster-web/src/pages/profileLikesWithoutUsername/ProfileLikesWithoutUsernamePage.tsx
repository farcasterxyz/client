import { useUserByFid } from 'farcaster-client-hooks';
import { memo } from 'react';

import { ProfileLikes } from '~/components/profiles/ProfileLikes';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileLikesWithoutUsernamePage = memo(() => {
  const { fid } = useParams('profileLikesWithoutUsername');

  const { result: userProfile } = useUserByFid({ fid }).data!;

  return <ProfileLikes userProfile={userProfile} />;
});

ProfileLikesWithoutUsernamePage.displayName = 'ProfileLikesWithoutUsernamePage';

export { ProfileLikesWithoutUsernamePage };
