import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useInternalEventing } from '../../../../providers/InternalEventingProvider';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildFeedItemsFetcher } from './buildFeedItemsFetcher';
import { buildFeedItemsKey } from './buildFeedItemsKey';
import { feedItemsDefaultQueryOptions } from './feedItemsDefaultQueryOptions';

const usePrefetchFeedItems = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchUpdateGloballyCachedCast = useBatchMergeIntoGloballyCachedCasts();
  const internalEventsTracker = useInternalEventing();

  return useCallback(
    ({
      feedKey,
      feedType,
      updateState,
      onNullFeedItemsResponse,
    }: {
      feedKey: string;
      feedType: string;
      updateState: boolean;
      onNullFeedItemsResponse: () => void;
    }) => {
      return queryClient.prefetchInfiniteQuery({
        ...feedItemsDefaultQueryOptions(feedKey),
        initialPageParam: undefined,
        queryKey: buildFeedItemsKey({ feedKey, feedType }),

        queryFn: buildFeedItemsFetcher({
          apiClient,
          feedKey,
          feedType,
          updateState,
          batchUpdateGloballyCachedCast,
          onNullFeedItemsResponse,
          internalEventsTracker,
        }),
      });
    },
    [
      queryClient,
      apiClient,
      batchUpdateGloballyCachedCast,
      internalEventsTracker,
    ],
  );
};

export { usePrefetchFeedItems };
