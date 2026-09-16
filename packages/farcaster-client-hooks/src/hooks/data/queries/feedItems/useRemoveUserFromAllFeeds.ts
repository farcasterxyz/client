import { useQueryClient } from '@tanstack/react-query';

import { buildFeedItemsKey } from './buildFeedItemsKey';
import { useRemoveUserFromFeedCacheKey } from './useRemoveUserFromFeedCacheKey';

export function useRemoveUserFromAllFeeds() {
  const queryClient = useQueryClient();
  const removeUserFromFeedCacheKey = useRemoveUserFromFeedCacheKey();

  return function ({ fid }: { fid: number }) {
    queryClient
      .getQueryCache()
      .findAll({
        queryKey: buildFeedItemsKey({}),
      })
      .forEach((query) => {
        removeUserFromFeedCacheKey({ feedCacheKey: query.queryKey, fid });
      });
  };
}
