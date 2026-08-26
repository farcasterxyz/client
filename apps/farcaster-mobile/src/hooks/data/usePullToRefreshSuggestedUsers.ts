import {
  buildSuggestedUsersKey,
  SuggestedUsersCache,
} from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshSuggestedUsers = ({
  refetch,
}: {
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly<SuggestedUsersCache>(
    buildSuggestedUsersKey({ limit: undefined, randomized: false }),
    refetch,
  );
};

export { usePullToRefreshSuggestedUsers };
