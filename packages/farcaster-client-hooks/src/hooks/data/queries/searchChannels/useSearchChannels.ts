import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildSearchChannelsFetcher } from './buildSearchChannelsFetcher';
import { buildSearchChannelsKey } from './buildSearchChannelsKey';

const gcTime = MILLIS_PER_MINUTE;

const useSearchChannels = ({
  limit = 20,
  q,
  prioritizeFollowed = false,
  forComposer = false,
}: {
  limit?: number;
  q: string;
  prioritizeFollowed?: boolean;
  forComposer?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchChannelsKey({ q, limit, prioritizeFollowed }),

    queryFn: buildSearchChannelsFetcher({
      q,
      prioritizeFollowed,
      forComposer,
      limit,
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    }),

    gcTime,
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useSearchChannels };
