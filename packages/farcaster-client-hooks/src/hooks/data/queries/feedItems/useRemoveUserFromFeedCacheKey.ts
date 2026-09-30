import { InfiniteData, QueryKey, useQueryClient } from '@tanstack/react-query';
import { ApiGetFeedItems200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

export function useRemoveUserFromFeedCacheKey() {
  const queryClient = useQueryClient();

  return useCallback(
    ({ feedCacheKey, fid }: { feedCacheKey: QueryKey; fid: number }) => {
      queryClient.setQueryData<InfiniteData<ApiGetFeedItems200Response>>(
        feedCacheKey,
        (data) => {
          if (!data) {
            return data;
          }

          let removedCast = false;
          const newPages = data.pages.map((page) => {
            const filteredItems = page.result.items.filter(
              (item) =>
                item.cast.author.fid !== fid &&
                (!item.replies?.length || item.replies[0].author.fid !== fid),
            );

            if (filteredItems.length === page.result.items.length) {
              return page;
            } else {
              removedCast = true;
              return { result: { ...page.result, items: filteredItems } };
            }
          });

          return {
            pageParams: data.pageParams,
            pages: removedCast ? newPages : data.pages,
          };
        },
      );
    },
    [queryClient],
  );
}
