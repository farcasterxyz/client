import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildUserFollowingChannelsFetcher } from './buildUserFollowingChannelsFetcher';
import { buildUserFollowingChannelsKey } from './buildUserFollowingChannelsKey';

const useUserFollowingChannels = ({
  forComposer,
}: {
  forComposer: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildUserFollowingChannelsKey({ forComposer }),

    queryFn: buildUserFollowingChannelsFetcher({
      forComposer,
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

const useNonSuspenseUserFollowingChannels = ({
  forComposer,
}: {
  forComposer: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildUserFollowingChannelsKey({ forComposer }),

    queryFn: buildUserFollowingChannelsFetcher({
      forComposer,
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useNonSuspenseUserFollowingChannels, useUserFollowingChannels };
