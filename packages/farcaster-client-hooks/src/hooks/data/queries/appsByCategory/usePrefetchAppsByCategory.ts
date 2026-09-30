import { useQueryClient } from '@tanstack/react-query';
import { ApiAppsSortBy } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { appsByCategoryDefaultQueryOptions } from './appsByCategoryDefaultQueryOptions';
import { buildAppsByCategoryFetcher } from './buildAppsByCategoryFetcher';
import { buildAppsByCategoryKey } from './buildAppsByCategoryKey';

const usePrefetchAppsByCategory = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({
      category,
      sortByKey,
      limit,
    }: {
      category: string;
      sortByKey: ApiAppsSortBy;
      limit?: number;
    }) => {
      return queryClient.prefetchQuery({
        ...appsByCategoryDefaultQueryOptions,
        queryKey: buildAppsByCategoryKey({ category, sortByKey, limit }),
        queryFn: buildAppsByCategoryFetcher({
          apiClient,
          category,
          sortByKey,
          limit,
        }),
      });
    },
    [apiClient, queryClient],
  );
};

export { usePrefetchAppsByCategory };
