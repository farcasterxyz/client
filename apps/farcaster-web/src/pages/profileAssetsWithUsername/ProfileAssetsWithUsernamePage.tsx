import { useUserByUsername } from 'farcaster-client-hooks';
import { memo } from 'react';

import { PageNotFound } from '~/components/page/PageNotFound';
import { ProfileAssets } from '~/components/profiles/ProfileAssets';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileAssetsWithUsernamePage = memo(() => {
  const { username } = useParams('profileAssetsWithUsername');

  const { data: userProfile } = useUserByUsername({ username });

  if (!userProfile) {
    return <PageNotFound title={`@${username} not found on Farcaster`} />;
  }

  return <ProfileAssets userProfile={userProfile.result} />;
});

ProfileAssetsWithUsernamePage.displayName = 'ProfileAssetsWithUsernamePage';

export { ProfileAssetsWithUsernamePage };
