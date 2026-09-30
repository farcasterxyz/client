import { useQueryClient } from '@tanstack/react-query';
import { ApiUserChannelsCategory } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { buildUserChannelsForCategoryFetcher } from './buildUserChannelsForCategoryFetcher';
import { buildUserChannelsForCategoryKey } from './buildUserChannelsForCategoryKey';

const usePrefetchUserChannelsForCategory = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  return useCallback(
    ({ fid, category }: { fid: number; category: ApiUserChannelsCategory }) => {
      const queryKey = buildUserChannelsForCategoryKey({ fid, category });

      queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildUserChannelsForCategoryFetcher({
          fid,
          category,
          apiClient,
          batchMergeIntoGloballyCachedChannels,
        }),
      });
    },
    [apiClient, batchMergeIntoGloballyCachedChannels, queryClient],
  );
};

export { usePrefetchUserChannelsForCategory };
