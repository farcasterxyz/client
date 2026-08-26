import { useUserByFid } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { Following } from '~/components/follows/Following';
import { useParams } from '~/hooks/navigation/useParams';

const FollowingWithoutUsernamePage: FC = memo(() => {
  const { fid } = useParams('followingWithoutUsername');

  const {
    result: { user },
  } = useUserByFid({ fid }).data!;

  return <Following user={user} />;
});

FollowingWithoutUsernamePage.displayName = 'FollowingWithoutUsernamePage';

export { FollowingWithoutUsernamePage };
