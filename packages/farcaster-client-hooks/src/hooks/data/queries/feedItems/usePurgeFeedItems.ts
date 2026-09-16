import { useQueryClient } from '@tanstack/react-query';
import { ApiFeedSortMode } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildFeedItemsKey } from './buildFeedItemsKey';

const usePurgeFeedItems = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      feedKey,
      feedType,
      sortMode,
      seedCastHash,
    }: {
      feedKey?: string;
      feedType?: string;
      sortMode?: ApiFeedSortMode;
      seedCastHash?: string;
    }) =>
      queryClient.removeQueries({
        queryKey: buildFeedItemsKey({
          feedKey,
          feedType,
          sortMode: sortMode?.type,
          seedCastHash,
        }),
      }),
    [queryClient],
  );
};

export { usePurgeFeedItems };
