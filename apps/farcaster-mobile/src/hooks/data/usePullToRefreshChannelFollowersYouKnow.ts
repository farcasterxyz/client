import { buildChannelFollowersYouKnowKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshChannelFollowersYouKnow = ({
  channelKey,
  limit,
  refetch,
}: {
  channelKey: string;
  limit: number;
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildChannelFollowersYouKnowKey({ channelKey, limit }),
    refetch,
  );
};

export { usePullToRefreshChannelFollowersYouKnow };
