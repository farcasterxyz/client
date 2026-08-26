import { buildUserCastsKey, UserCastsCache } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshUserCasts = ({
  fid,
  refetch,
}: {
  fid: number;
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly<UserCastsCache>(
    buildUserCastsKey({ fid }),
    refetch,
  );
};

export { usePullToRefreshUserCasts };
