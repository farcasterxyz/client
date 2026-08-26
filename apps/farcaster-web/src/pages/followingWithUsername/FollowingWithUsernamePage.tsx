import { useUserByUsername } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { Following } from '~/components/follows/Following';
import { useParams } from '~/hooks/navigation/useParams';

const FollowingWithUsernamePage: FC = memo(() => {
  const { username } = useParams('followingWithUsername');

  const {
    result: { user },
  } = useUserByUsername({ username }).data!;

  return <Following user={user} />;
});

FollowingWithUsernamePage.displayName = 'FollowingWithUsernamePage';

export { FollowingWithUsernamePage };
