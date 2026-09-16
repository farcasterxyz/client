import { useUserByUsername } from 'farcaster-client-hooks';
import { memo } from 'react';

import { PageNotFound } from '~/components/page/PageNotFound';
import { ProfileSnapCasts } from '~/components/profiles/ProfileSnapCasts';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileSnapCastsWithUsernamePage = memo(() => {
  const { username } = useParams('profileSnapCastsWithUsername');

  const userProfile = useUserByUsername({ username }).data?.result;

  if (!userProfile) {
    return <PageNotFound title={`@${username} not found on Farcaster`} />;
  }

  return <ProfileSnapCasts userProfile={userProfile} />;
});

ProfileSnapCastsWithUsernamePage.displayName =
  'ProfileSnapCastsWithUsernamePage';

export { ProfileSnapCastsWithUsernamePage };
