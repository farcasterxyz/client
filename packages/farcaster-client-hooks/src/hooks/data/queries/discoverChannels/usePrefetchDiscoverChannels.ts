import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildDiscoverChannelsFetcher } from './buildDiscoverChannelsFetcher';
import { buildDiscoverChannelsKey } from './buildDiscoverChannelsKey';

const usePrefetchDiscoverChannels = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useCallback(async () => {
    return queryClient.prefetchInfiniteQuery({
      initialPageParam: undefined,
      queryKey: buildDiscoverChannelsKey(),

      queryFn: buildDiscoverChannelsFetcher({
        apiClient,
        batchMergeIntoGloballyCachedChannels,
      }),
    });
  }, [apiClient, batchMergeIntoGloballyCachedChannels, queryClient]);
};

export { usePrefetchDiscoverChannels };
