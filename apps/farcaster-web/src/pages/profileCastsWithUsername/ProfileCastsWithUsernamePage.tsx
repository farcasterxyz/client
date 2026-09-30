import { useUserByUsername } from 'farcaster-client-hooks';
import { memo } from 'react';

import { PageNotFound } from '~/components/page/PageNotFound';
import { ProfileCasts } from '~/components/profiles/ProfileCasts';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileCastsWithUsernamePage = memo(() => {
  const { username } = useParams('profileCastsWithUsername');

  const { data: userProfile } = useUserByUsername({ username });

  if (!userProfile) {
    return <PageNotFound title={`@${username} not found on Farcaster`} />;
  }

  return <ProfileCasts userProfile={userProfile.result} />;
});

ProfileCastsWithUsernamePage.displayName = 'ProfileCastsWithUsernamePage';

export { ProfileCastsWithUsernamePage };
