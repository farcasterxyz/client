import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { ApiGetFeedItems200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildFeedItemsKey } from './buildFeedItemsKey';

export function useRemoveCastFromFeed() {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      feedKey,
      feedType,
      castHash,
    }: {
      feedKey: string;
      feedType: string;
      castHash: string;
    }) => {
      queryClient.setQueryData<InfiniteData<ApiGetFeedItems200Response>>(
        buildFeedItemsKey({ feedKey, feedType }),
        (data) => {
          if (!data) {
            return data;
          }

          let removedCast = false;
          const newPages = data.pages.map((page) => {
            const filteredItems = page.result.items.filter(
              (item) =>
                item.cast.hash !== castHash &&
                (!item.replies?.length || item.replies[0].hash !== castHash),
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
