import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildFeedSummariesFetcher } from './buildFeedSummariesFetcher';
import { buildFeedSummariesKey } from './buildFeedSummariesKey';
import { feedSummariesDefaultQueryOptions } from './feedSummariesDefaultQueryOptions';

const usePrefetchFeedSummaries = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useCallback(async () => {
    await queryClient.prefetchQuery({
      ...feedSummariesDefaultQueryOptions,
      queryKey: buildFeedSummariesKey(),

      queryFn: buildFeedSummariesFetcher({
        apiClient,
        batchMergeIntoGloballyCachedChannels,
      }),
    });
  }, [apiClient, batchMergeIntoGloballyCachedChannels, queryClient]);
};

export { usePrefetchFeedSummaries };
