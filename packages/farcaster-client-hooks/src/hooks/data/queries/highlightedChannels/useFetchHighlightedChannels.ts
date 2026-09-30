import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildHighlightedChannelsFetcher } from './buildHighlightedChannelsFetcher';
import { buildHighlightedChannelsKey } from './buildHighlightedChannelsKey';

const useFetchHighlightedChannels = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useCallback(async () => {
    const response = await buildHighlightedChannelsFetcher({
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    })();

    queryClient.setQueryData(buildHighlightedChannelsKey(), response);

    return response;
  }, [apiClient, batchMergeIntoGloballyCachedChannels, queryClient]);
};

export { useFetchHighlightedChannels };
