import { buildUserLikedCastsKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshUserLikedCasts = ({
  fid,
  refetch,
}: {
  fid: number;
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildUserLikedCastsKey({ fid }),
    refetch,
  );
};

export { usePullToRefreshUserLikedCasts };
