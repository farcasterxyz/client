import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser';
import { buildChannelFollowersYouKnowFetcher } from './buildChannelFollowersYouKnowFetcher';
import { buildChannelFollowersYouKnowKey } from './buildChannelFollowersYouKnowKey';

const usePrefetchChannelFollowersYouKnow = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      channelKey,
      limit,
      shouldSkipIfRecentlyPrefetched = false,
    }: {
      channelKey: string;
      limit: number;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildChannelFollowersYouKnowKey({ channelKey, limit });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildChannelFollowersYouKnowFetcher({
          apiClient,
          batchMergeIntoGloballyCachedUsers,
          channelKey,
          limit,
        }),
      });
    },
    [
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      checkIfRecentlyPrefetched,
      queryClient,
    ],
  );
};

export { usePrefetchChannelFollowersYouKnow };
