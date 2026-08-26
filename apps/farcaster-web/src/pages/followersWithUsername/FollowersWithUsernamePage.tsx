import { useUserByUsername } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { Followers } from '~/components/follows/Followers';
import { useParams } from '~/hooks/navigation/useParams';

const FollowersWithUsernamePage: FC = memo(() => {
  const { username } = useParams('followersWithUsername');

  const {
    result: { user },
  } = useUserByUsername({ username }).data!;

  return <Followers user={user} />;
});

FollowersWithUsernamePage.displayName = 'FollowersWithUsernamePage';

export { FollowersWithUsernamePage };
