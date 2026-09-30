import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import {
  ApiDiscoveryAppCategory,
  ApiDiscoveryAppList,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useFlatPaginatedResults } from '../../helpers';
import { buildDiscoverAppsFetcher } from './buildDiscoverAppsFetcher';
import { buildDiscoverAppsKey } from './buildDiscoverAppsKey';
import { discoverAppsDefaultQueryOptions } from './discoverAppsDefaultQueryOptions';

const useDiscoverApps = ({
  list,
  categoryFilter,
}: {
  list: ApiDiscoveryAppList;
  categoryFilter?: ApiDiscoveryAppCategory;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    ...discoverAppsDefaultQueryOptions,
    initialPageParam: undefined,
    queryKey: buildDiscoverAppsKey({ list, categoryFilter }),

    queryFn: buildDiscoverAppsFetcher({
      apiClient,
      list,
      categoryFilter,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const flatData = useFlatPaginatedResults({
    data: result.data,
    key: 'apps',
  });

  return extendResult(result, { flatData });
};

export { useDiscoverApps };
