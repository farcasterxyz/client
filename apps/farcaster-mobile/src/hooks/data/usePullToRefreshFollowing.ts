import { buildFollowingKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshFollowing = ({
  fid,
  refetch,
}: {
  fid: number;
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildFollowingKey({ fid }),
    refetch,
  );
};

export { usePullToRefreshFollowing };
