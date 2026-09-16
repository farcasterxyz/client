import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildDiscoverChannelsFetcher } from './buildDiscoverChannelsFetcher';
import { buildDiscoverChannelsKey } from './buildDiscoverChannelsKey';

const useDiscoverChannels = () => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildDiscoverChannelsKey(),

    queryFn: buildDiscoverChannelsFetcher({
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useDiscoverChannels };
