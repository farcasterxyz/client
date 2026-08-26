import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildAllStarterPacksFetcher } from './buildAllStarterPacksFetcher';
import { buildAllStarterPacksKey } from './buildAllStarterPacksKey';

const usePrefetchAllStarterPacks = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(() => {
    const queryKey = buildAllStarterPacksKey();

    if (checkIfRecentlyPrefetched({ queryKey })) {
      return;
    }

    return queryClient.prefetchInfiniteQuery({
      initialPageParam: undefined,
      queryKey: queryKey,
      queryFn: buildAllStarterPacksFetcher({
        apiClient,
      }),
    });
  }, [checkIfRecentlyPrefetched, queryClient, apiClient]);
};

export { usePrefetchAllStarterPacks };
