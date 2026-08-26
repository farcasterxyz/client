import { buildFollowersKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshFollowers = ({
  fid,
  refetch,
}: {
  fid: number;
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildFollowersKey({ fid }),
    refetch,
  );
};

export { usePullToRefreshFollowers };
