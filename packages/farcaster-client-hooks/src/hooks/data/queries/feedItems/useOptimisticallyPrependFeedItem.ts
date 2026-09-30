import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiCastFeedItem,
  ApiGetFeedItems200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildFeedItemsKey } from './buildFeedItemsKey';

export function useOptimisticallyPrependFeedItem() {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      feedKey,
      feedItem,
      feedType,
    }: {
      feedKey: string;
      feedItem: ApiCastFeedItem;
      feedType: string;
    }) => {
      const queryKey = buildFeedItemsKey({ feedKey, feedType });

      queryClient.setQueryData<InfiniteData<ApiGetFeedItems200Response>>(
        queryKey,
        (currentData) => {
          const page0 = currentData?.pages?.[0];
          if (!page0) {
            return currentData;
          }

          const newPage0 = {
            result: {
              ...page0.result,
              items: [feedItem, ...page0.result.items],
            },
          } satisfies ApiGetFeedItems200Response;

          return {
            pageParams: currentData.pageParams,
            pages: [newPage0, ...currentData.pages.slice(1)],
          };
        },
      );
    },
    [queryClient],
  );
}
