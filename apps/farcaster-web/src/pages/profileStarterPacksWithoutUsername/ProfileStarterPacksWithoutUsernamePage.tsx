import { useUserByFid } from 'farcaster-client-hooks';
import { memo } from 'react';

import { ProfileLikes } from '~/components/profiles/ProfileLikes';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileStarterPacksWithoutUsernamePage = memo(() => {
  const { fid } = useParams('profileStarterPacksWithoutUsername');

  const { result: userProfile } = useUserByFid({ fid }).data!;

  return <ProfileLikes userProfile={userProfile} />;
});

ProfileStarterPacksWithoutUsernamePage.displayName =
  'ProfileStarterPacksWithoutUsernamePage';

export { ProfileStarterPacksWithoutUsernamePage };
