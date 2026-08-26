import { useUserByFid } from 'farcaster-client-hooks';
import { memo } from 'react';

import { ProfileCasts } from '~/components/profiles/ProfileCasts';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileCastsWithoutUsernamePage = memo(() => {
  const { fid } = useParams('profileCastsWithoutUsername');

  const { result: userProfile } = useUserByFid({ fid }).data!;

  return <ProfileCasts userProfile={userProfile} />;
});

ProfileCastsWithoutUsernamePage.displayName = 'ProfileCastsWithoutUsernamePage';

export { ProfileCastsWithoutUsernamePage };
