import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildFeedSummariesFetcher } from './buildFeedSummariesFetcher';
import { buildFeedSummariesKey } from './buildFeedSummariesKey';
import { feedSummariesDefaultQueryOptions } from './feedSummariesDefaultQueryOptions';

const useNonSuspenseFeedSummaries = () => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useQuery({
    ...feedSummariesDefaultQueryOptions,
    queryKey: buildFeedSummariesKey(),
    queryFn: buildFeedSummariesFetcher({
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    }),
  });
};

export { useNonSuspenseFeedSummaries };
