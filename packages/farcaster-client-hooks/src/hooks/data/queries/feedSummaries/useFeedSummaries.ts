import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildFeedSummariesFetcher } from './buildFeedSummariesFetcher';
import { buildFeedSummariesKey } from './buildFeedSummariesKey';
import { feedSummariesDefaultQueryOptions } from './feedSummariesDefaultQueryOptions';

const useFeedSummaries = () => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useSuspenseQuery({
    ...feedSummariesDefaultQueryOptions,
    queryKey: buildFeedSummariesKey(),

    queryFn: buildFeedSummariesFetcher({
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    }),
  });
};

export { useFeedSummaries };
