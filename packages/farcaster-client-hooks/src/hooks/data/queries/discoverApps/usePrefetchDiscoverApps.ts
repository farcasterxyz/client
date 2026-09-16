import { useQueryClient } from '@tanstack/react-query';
import {
  ApiDiscoveryAppCategory,
  ApiDiscoveryAppList,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildDiscoverAppsFetcher } from './buildDiscoverAppsFetcher';
import { buildDiscoverAppsKey } from './buildDiscoverAppsKey';
import { discoverAppsDefaultQueryOptions } from './discoverAppsDefaultQueryOptions';

const usePrefetchDiscoverApps = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      list,
      categoryFilter,
    }: {
      list: ApiDiscoveryAppList;
      categoryFilter?: ApiDiscoveryAppCategory;
    }) => {
      const queryKey = buildDiscoverAppsKey({
        list,
        categoryFilter,
      });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        ...discoverAppsDefaultQueryOptions,
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildDiscoverAppsFetcher({
          apiClient,
          list,
          categoryFilter,
        }),
      });
    },
    [apiClient, checkIfRecentlyPrefetched, queryClient],
  );
};

export { usePrefetchDiscoverApps };
