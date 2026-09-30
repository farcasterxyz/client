import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTokenWatchlistsFetcher } from './buildTokenWatchlistsFetcher';
import { buildTokenWatchlistsKey } from './buildTokenWatchlistsKey';

const usePrefetchTokenWatchlists = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    const queryKey = buildTokenWatchlistsKey();

    return queryClient.prefetchInfiniteQuery({
      initialPageParam: undefined,
      queryKey: queryKey,
      queryFn: buildTokenWatchlistsFetcher({ apiClient }),
    });
  }, [apiClient, queryClient]);
};

export { usePrefetchTokenWatchlists };
