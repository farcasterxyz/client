import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildSuggestedStarterPacksFetcher } from './buildSuggestedStarterPacksFetcher';
import { buildSuggestedStarterPacksKey } from './buildSuggestedStarterPacksKey';

const usePrefetchSuggestedStarterPacks = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(() => {
    const queryKey = buildSuggestedStarterPacksKey();

    if (checkIfRecentlyPrefetched({ queryKey })) {
      return;
    }

    return queryClient.prefetchInfiniteQuery({
      initialPageParam: undefined,
      queryKey: queryKey,
      queryFn: buildSuggestedStarterPacksFetcher({
        apiClient,
      }),
    });
  }, [checkIfRecentlyPrefetched, queryClient, apiClient]);
};

export { usePrefetchSuggestedStarterPacks };
