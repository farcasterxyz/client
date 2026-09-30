import { AdminFeedCache, buildAdminFeedKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshAdminFeed = ({
  refetch,
  offset,
}: {
  refetch: () => Promise<unknown>;
  offset?: number;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly<AdminFeedCache>(
    buildAdminFeedKey({}),
    refetch,
    offset,
  );
};

export { usePullToRefreshAdminFeed };
