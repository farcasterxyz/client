import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { InfiniteCache } from '../../../../types';
import { buildFeedItemsKey } from './buildFeedItemsKey';

const useInvalidateFeedItems = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ feedKey, feedType }: { feedKey: string; feedType: string }) => {
      const queryKey = buildFeedItemsKey({ feedKey, feedType });

      // React Query requeries each page with the page params it was originally fetched with.
      // This doesn't work for us as the first page may have been fetched with excluded
      // ids, e.g. as a result of pull to refresh, and using them will cause the feed to
      // miss items. Thus we remove the page params from all pages. After the first page is
      // fetched, React Query will regenerate the params for the rest correctly.
      queryClient.setQueryData(
        queryKey,
        (prevData: InfiniteCache<unknown> | null) => {
          if (!prevData || !prevData.pages || !prevData.pageParams.length) {
            return prevData;
          }

          return {
            pageParams: Array.from({ length: prevData.pageParams.length }),
            pages: prevData.pages,
          };
        },
      );

      return queryClient.invalidateQueries({
        queryKey: queryKey,
      });
    },
    [queryClient],
  );
};

export { useInvalidateFeedItems };
