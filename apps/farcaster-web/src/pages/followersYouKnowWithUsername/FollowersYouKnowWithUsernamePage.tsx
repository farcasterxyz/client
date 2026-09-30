import { useUserByUsername } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { FollowersYouKnow } from '~/components/follows/FollowersYouKnow';
import { useParams } from '~/hooks/navigation/useParams';

const FollowersYouKnowWithUsernamePage: FC = memo(() => {
  const { username } = useParams('followersYouKnowWithUsername');

  const {
    result: { user },
  } = useUserByUsername({ username }).data!;

  return <FollowersYouKnow user={user} />;
});

FollowersYouKnowWithUsernamePage.displayName =
  'FollowersYouKnowWithUsernamePage';

export { FollowersYouKnowWithUsernamePage };
