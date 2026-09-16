import { useUserByFid } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { FollowersYouKnow } from '~/components/follows/FollowersYouKnow';
import { useParams } from '~/hooks/navigation/useParams';

const FollowersYouKnowWithoutUsernamePage: FC = memo(() => {
  const { fid } = useParams('followersYouKnowWithoutUsername');

  const {
    result: { user },
  } = useUserByFid({ fid }).data!;

  return <FollowersYouKnow user={user} />;
});

FollowersYouKnowWithoutUsernamePage.displayName =
  'FollowersYouKnowWithoutUsernamePage';

export { FollowersYouKnowWithoutUsernamePage };
