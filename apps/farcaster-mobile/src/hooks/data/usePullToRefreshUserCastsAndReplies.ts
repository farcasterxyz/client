import { buildUserCastsKey, UserCastsCache } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshUserCastsAndReplies = ({
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

export { usePullToRefreshUserCastsAndReplies };
