import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildSuggestedChannelsFetcher } from './buildSuggestedChannelsFetcher';
import { buildSuggestedChannelsKey } from './buildSuggestedChannelsKey';

const useSuggestedChannels = ({
  limit,
  currentChannelKey,
}: {
  limit?: number;
  currentChannelKey?: string;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSuggestedChannelsKey({ limit, currentChannelKey }),

    queryFn: buildSuggestedChannelsFetcher({
      apiClient,
      currentChannelKey,
      batchMergeIntoGloballyCachedChannels,
      limit,
    }),

    getNextPageParam: getNextPageCursor,
  });
};

export { useSuggestedChannels };
