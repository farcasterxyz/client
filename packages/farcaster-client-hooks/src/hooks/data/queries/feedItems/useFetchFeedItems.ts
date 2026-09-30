import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useInternalEventing } from '../../../../providers/InternalEventingProvider';
import { usePurged } from '../../../../providers/PurgedProvider';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildFeedItemsFetcher } from './buildFeedItemsFetcher';
import { buildFeedItemsKey } from './buildFeedItemsKey';

type FeedItemsResponse = ReturnType<ReturnType<typeof buildFeedItemsFetcher>>;

const useFetchFeedItems = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const batchUpdateGloballyCachedCast = useBatchMergeIntoGloballyCachedCasts();
  const internalEventsTracker = useInternalEventing();
  const { markAsPurged } = usePurged();

  return useCallback(
    async ({
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
      const queryKey = buildFeedItemsKey({ feedKey, feedType });

      const fetchFeedItems = buildFeedItemsFetcher({
        apiClient,
        feedKey,
        feedType,
        updateState,
        batchUpdateGloballyCachedCast,
        internalEventsTracker,
        onNullFeedItemsResponse,
      }) as (params: { pageParam: number | undefined }) => FeedItemsResponse;

      const response = await fetchFeedItems({ pageParam: undefined });

      // Mark as purged so that if a feed component mounts immediately it doesn't purge the just
      // loaded data
      markAsPurged({ queryKey });

      queryClient.setQueryData<InfiniteData<Awaited<FeedItemsResponse>>>(
        buildFeedItemsKey({ feedKey, feedType }),
        () => {
          const nextData = {
            pageParams: [undefined],
            pages: [response],
          };

          return nextData;
        },
      );
    },
    [
      apiClient,
      batchUpdateGloballyCachedCast,
      internalEventsTracker,
      markAsPurged,
      queryClient,
    ],
  );
};

export { useFetchFeedItems };
