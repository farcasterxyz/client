import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser/useBatchMergeIntoGloballyCachedUsers';
import { buildChannelFollowersYouKnowFetcher } from './buildChannelFollowersYouKnowFetcher';
import { buildChannelFollowersYouKnowKey } from './buildChannelFollowersYouKnowKey';

const useChannelFollowersYouKnow = ({
  channelKey,
  limit,
}: {
  channelKey: string;
  limit: number;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildChannelFollowersYouKnowKey({ channelKey, limit }),

    queryFn: buildChannelFollowersYouKnowFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      channelKey,
      limit,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useChannelFollowersYouKnow };
