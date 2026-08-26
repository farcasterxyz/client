import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildFeedSummariesFetcher } from './buildFeedSummariesFetcher';
import { buildFeedSummariesKey } from './buildFeedSummariesKey';

const useFetchFeedSummaries = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useCallback(async () => {
    const response = await buildFeedSummariesFetcher({
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    })();

    queryClient.setQueryData(buildFeedSummariesKey(), response);

    return response;
  }, [apiClient, batchMergeIntoGloballyCachedChannels, queryClient]);
};

export { useFetchFeedSummaries };
