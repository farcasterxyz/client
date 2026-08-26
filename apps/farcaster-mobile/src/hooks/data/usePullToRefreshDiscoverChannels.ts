import {
  buildDiscoverChannelsKey,
  useInvalidateFeedSummaries,
  useInvalidateHighlightedChannels,
  useRefreshInfiniteFirstPageOnly,
} from 'farcaster-client-hooks';

import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';

const usePullToRefreshDiscoverChannels = ({
  refetch,
}: {
  refetch: () => Promise<unknown>;
}) => {
  const refreshDiscoveryFirstPage = useRefreshInfiniteFirstPageOnly(
    buildDiscoverChannelsKey(),
    refetch,
  );
  // Also invalidate feed summaries and highlighted channels
  const invalidateFeedSummaries = useInvalidateFeedSummaries();
  const invalidateHighlightedChannels = useInvalidateHighlightedChannels();
  return usePullToRefreshInfinite({
    refetch: async () => {
      await Promise.all([
        refreshDiscoveryFirstPage(),
        invalidateFeedSummaries(),
        invalidateHighlightedChannels(),
      ]);
    },
  });
};

export { usePullToRefreshDiscoverChannels };
