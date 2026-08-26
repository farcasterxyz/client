import { useSuspenseQuery } from '@tanstack/react-query';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRecentlyUsedAppsFetcher } from './buildRecentlyUsedAppsFetcher';
import { buildRecentlyUsedAppsKey } from './buildRecentlyUsedAppsKey';
import { recentlyUsedAppsDefaultQueryOptions } from './recentlyUsedAppsDefaultQueryOptions';

const useRecentlyUsedApps = ({ limit }: { limit?: number } = {}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseQuery({
    ...recentlyUsedAppsDefaultQueryOptions,
    queryKey: buildRecentlyUsedAppsKey({ limit }),
    queryFn: buildRecentlyUsedAppsFetcher({
      apiClient,
      limit,
    }),
    staleTime: MILLIS_PER_MINUTE * 5,
  });

  return result;
};

export { useRecentlyUsedApps };
