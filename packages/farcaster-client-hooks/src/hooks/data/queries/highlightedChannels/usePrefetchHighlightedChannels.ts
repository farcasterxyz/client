import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildHighlightedChannelsFetcher } from './buildHighlightedChannelsFetcher';
import { buildHighlightedChannelsKey } from './buildHighlightedChannelsKey';
import { highlightedChannelsDefaultQueryOptions } from './highlightedChannelsDefaultQueryOptions';

const usePrefetchHighlightedChannels = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useCallback(async () => {
    await queryClient.prefetchQuery({
      ...highlightedChannelsDefaultQueryOptions,
      queryKey: buildHighlightedChannelsKey(),
      queryFn: buildHighlightedChannelsFetcher({
        apiClient,
        batchMergeIntoGloballyCachedChannels,
      }),
    });
  }, [apiClient, batchMergeIntoGloballyCachedChannels, queryClient]);
};

export { usePrefetchHighlightedChannels };
