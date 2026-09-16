import { useUserByUsername } from 'farcaster-client-hooks';
import { memo } from 'react';

import { PageNotFound } from '~/components/page/PageNotFound';
import { ProfileStarterPacks } from '~/components/profiles/ProfileStarterPacks';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileStarterPacksWithUsernamePage = memo(() => {
  const { username } = useParams('profileStarterPacksWithUsername');

  const { data: userProfile } = useUserByUsername({ username });

  if (!userProfile) {
    return <PageNotFound title={`@${username} not found on Farcaster`} />;
  }

  return <ProfileStarterPacks userProfile={userProfile.result} />;
});

ProfileStarterPacksWithUsernamePage.displayName =
  'ProfileStarterPacksWithUsernamePage';

export { ProfileStarterPacksWithUsernamePage };
