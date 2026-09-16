import { useCallback } from 'react';

import { buildFeedItemsKey } from './buildFeedItemsKey';
import { useRemoveUserFromFeedCacheKey } from './useRemoveUserFromFeedCacheKey';

export function useRemoveUserFromFeed() {
  const removeUserFromFeedCacheKey = useRemoveUserFromFeedCacheKey();

  return useCallback(
    ({
      feedKey,
      feedType,
      fid,
    }: {
      feedKey: string;
      feedType: string;
      fid: number;
    }) => {
      removeUserFromFeedCacheKey({
        feedCacheKey: buildFeedItemsKey({ feedKey, feedType }),
        fid,
      });
    },
    [removeUserFromFeedCacheKey],
  );
}
