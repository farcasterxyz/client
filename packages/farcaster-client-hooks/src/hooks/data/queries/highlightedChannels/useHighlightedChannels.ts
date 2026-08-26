import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildHighlightedChannelsFetcher } from './buildHighlightedChannelsFetcher';
import { buildHighlightedChannelsKey } from './buildHighlightedChannelsKey';
import { highlightedChannelsDefaultQueryOptions } from './highlightedChannelsDefaultQueryOptions';

const useHighlightedChannels = () => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useSuspenseQuery({
    ...highlightedChannelsDefaultQueryOptions,
    queryKey: buildHighlightedChannelsKey(),
    queryFn: buildHighlightedChannelsFetcher({
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    }),
  });
};

export { useHighlightedChannels };
