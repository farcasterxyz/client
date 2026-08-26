import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildUserFollowingChannelsFetcher } from './buildUserFollowingChannelsFetcher';
import { buildUserFollowingChannelsKey } from './buildUserFollowingChannelsKey';

const usePrefetchUserFollowingChannels = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      forComposer,
      shouldSkipIfRecentlyPrefetched = true,
    }: {
      forComposer: boolean;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const queryKey = buildUserFollowingChannelsKey({ forComposer });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildUserFollowingChannelsFetcher({
          forComposer,
          apiClient,
          batchMergeIntoGloballyCachedChannels,
        }),
      });
    },
    [
      apiClient,
      batchMergeIntoGloballyCachedChannels,
      checkIfRecentlyPrefetched,
      queryClient,
    ],
  );
};

export { usePrefetchUserFollowingChannels };
