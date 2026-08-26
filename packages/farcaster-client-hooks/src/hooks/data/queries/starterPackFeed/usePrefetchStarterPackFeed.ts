import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildStarterPackFeedFetcher } from './buildStarterPackFeedFetcher';
import { buildStarterPackFeedKey } from './buildStarterPackFeedKey';

const usePrefetchStarterPackFeed = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({ id }: { id: string }) => {
      const queryKey = buildStarterPackFeedKey({ id });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: queryKey,
        queryFn: buildStarterPackFeedFetcher({
          apiClient,
          id,
          batchMergeIntoGloballyCachedCasts,
        }),
      });
    },
    [
      apiClient,
      batchMergeIntoGloballyCachedCasts,
      checkIfRecentlyPrefetched,
      queryClient,
    ],
  );
};

export { usePrefetchStarterPackFeed };
