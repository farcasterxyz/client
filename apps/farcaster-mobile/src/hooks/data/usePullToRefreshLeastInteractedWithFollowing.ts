import { buildLeastInteractedWithFollowingKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshLeastInteractedWithFollowing = ({
  refetch,
}: {
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildLeastInteractedWithFollowingKey(),
    refetch,
  );
};

export { usePullToRefreshLeastInteractedWithFollowing };
