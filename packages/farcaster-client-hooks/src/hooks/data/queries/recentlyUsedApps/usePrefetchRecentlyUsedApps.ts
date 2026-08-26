import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRecentlyUsedAppsFetcher } from './buildRecentlyUsedAppsFetcher';
import { buildRecentlyUsedAppsKey } from './buildRecentlyUsedAppsKey';
import { recentlyUsedAppsDefaultQueryOptions } from './recentlyUsedAppsDefaultQueryOptions';

const usePrefetchRecentlyUsedApps = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({ limit }: { limit?: number } = {}) => {
      return queryClient.prefetchQuery({
        ...recentlyUsedAppsDefaultQueryOptions,
        queryKey: buildRecentlyUsedAppsKey({ limit }),
        queryFn: buildRecentlyUsedAppsFetcher({
          apiClient,
          limit,
        }),
      });
    },
    [apiClient, queryClient],
  );
};

export { usePrefetchRecentlyUsedApps };
