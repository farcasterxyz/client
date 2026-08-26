import { useUserByFid } from 'farcaster-client-hooks';
import { memo } from 'react';

import { ProfileSnapCasts } from '~/components/profiles/ProfileSnapCasts';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileSnapCastsWithoutUsernamePage = memo(() => {
  const { fid } = useParams('profileSnapCastsWithoutUsername');

  const { result: userProfile } = useUserByFid({ fid }).data!;

  return <ProfileSnapCasts userProfile={userProfile} />;
});

ProfileSnapCastsWithoutUsernamePage.displayName =
  'ProfileSnapCastsWithoutUsernamePage';

export { ProfileSnapCastsWithoutUsernamePage };
