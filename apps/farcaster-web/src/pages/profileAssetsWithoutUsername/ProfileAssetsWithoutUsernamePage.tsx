import { useUserByFid } from 'farcaster-client-hooks';
import { memo } from 'react';

import { ProfileAssets } from '~/components/profiles/ProfileAssets';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileAssetsWithoutUsernamePage = memo(() => {
  const { fid } = useParams('profileAssetsWithoutUsername');

  const { result: userProfile } = useUserByFid({ fid }).data!;

  return <ProfileAssets userProfile={userProfile} />;
});

ProfileAssetsWithoutUsernamePage.displayName =
  'ProfileAssetsWithoutUsernamePage';

export { ProfileAssetsWithoutUsernamePage };
