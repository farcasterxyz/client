import { buildChannelFollowersKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshChannelFollowers = ({
  channelKey,
  query,
  refetch,
}: {
  channelKey: string;
  query?: string;
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildChannelFollowersKey({ channelKey, query }),
    refetch,
  );
};

export { usePullToRefreshChannelFollowers };
