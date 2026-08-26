import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildSuggestedChannelsFetcher } from './buildSuggestedChannelsFetcher';
import { buildSuggestedChannelsKey } from './buildSuggestedChannelsKey';

const usePrefetchSuggestedChannels = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useCallback(async () => {
    return queryClient.prefetchInfiniteQuery({
      initialPageParam: undefined,
      queryKey: buildSuggestedChannelsKey({ limit: undefined }),

      queryFn: buildSuggestedChannelsFetcher({
        apiClient,
        batchMergeIntoGloballyCachedChannels,
      }),
    });
  }, [apiClient, batchMergeIntoGloballyCachedChannels, queryClient]);
};

export { usePrefetchSuggestedChannels };
