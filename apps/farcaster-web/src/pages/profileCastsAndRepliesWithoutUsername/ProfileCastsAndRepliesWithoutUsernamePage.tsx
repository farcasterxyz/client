import { useUserByFid } from 'farcaster-client-hooks';
import { memo } from 'react';

import { ProfileCastsAndReplies } from '~/components/profiles/ProfileCastsAndReplies';
import { useParams } from '~/hooks/navigation/useParams';

const ProfileCastsAndRepliesWithoutUsernamePage = memo(() => {
  const { fid } = useParams('profileCastsAndRepliesWithoutUsername');

  const { result: userProfile } = useUserByFid({ fid }).data!;

  return <ProfileCastsAndReplies userProfile={userProfile} />;
});

ProfileCastsAndRepliesWithoutUsernamePage.displayName =
  'ProfileCastsAndRepliesWithoutUsernamePage';

export { ProfileCastsAndRepliesWithoutUsernamePage };
