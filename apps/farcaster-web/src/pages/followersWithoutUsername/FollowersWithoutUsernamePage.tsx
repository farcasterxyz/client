import { useUserByFid } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { Followers } from '~/components/follows/Followers';
import { useParams } from '~/hooks/navigation/useParams';

const FollowersWithoutUsernamePage: FC = memo(() => {
  const { fid } = useParams('followersWithoutUsername');

  const {
    result: { user },
  } = useUserByFid({ fid }).data!;

  return <Followers user={user} />;
});

FollowersWithoutUsernamePage.displayName = 'FollowersWithoutUsernamePage';

export { FollowersWithoutUsernamePage };
