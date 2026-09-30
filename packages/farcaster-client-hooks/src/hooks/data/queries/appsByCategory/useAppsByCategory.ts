import { useQuery } from '@tanstack/react-query';
import { ApiAppsSortBy } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { appsByCategoryDefaultQueryOptions } from './appsByCategoryDefaultQueryOptions';
import { buildAppsByCategoryFetcher } from './buildAppsByCategoryFetcher';
import { buildAppsByCategoryKey } from './buildAppsByCategoryKey';

const useAppsByCategory = ({
  category,
  sortByKey,
  limit,
  enabled = true,
}: {
  category: string;
  sortByKey: ApiAppsSortBy;
  limit?: number;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    ...appsByCategoryDefaultQueryOptions,
    queryKey: buildAppsByCategoryKey({ category, sortByKey, limit }),
    queryFn: buildAppsByCategoryFetcher({
      apiClient,
      category,
      sortByKey,
      limit,
    }),
    enabled,
  });

  return result;
};

export { useAppsByCategory };
