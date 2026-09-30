import { useUserByUsername } from 'farcaster-client-hooks';
import { memo } from 'react';

import { ProfileCastsAndReplies } from '~/components/profiles/ProfileCastsAndReplies';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileCastsAndRepliesWithUsernamePage = memo(() => {
  const { username } = useParams('profileCastsAndRepliesWithUsername');

  const { result: userProfile } = useUserByUsername({ username }).data!;

  return <ProfileCastsAndReplies userProfile={userProfile} />;
});

ProfileCastsAndRepliesWithUsernamePage.displayName =
  'ProfileCastsAndRepliesWithUsernamePage';

export { ProfileCastsAndRepliesWithUsernamePage };
