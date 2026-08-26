import { buildBookmarkedCastsKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshBookmarkedCasts = ({
  refetch,
}: {
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildBookmarkedCastsKey(),
    refetch,
  );
};

export { usePullToRefreshBookmarkedCasts };
