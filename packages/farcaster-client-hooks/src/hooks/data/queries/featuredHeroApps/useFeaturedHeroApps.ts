import { useQuery } from '@tanstack/react-query';
import { ApiGetFeaturedHeroAppsQueryParams } from 'farcaster-client-data';

import { MILLIS_PER_HOUR } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildFeaturedHeroAppsFetcher } from './buildFeaturedHeroAppsFetcher';
import { buildFeaturedHeroAppsKey } from './buildFeaturedHeroAppsKey';

const useFeaturedHeroApps = (
  params: ApiGetFeaturedHeroAppsQueryParams = {},
  options: {
    enabled?: boolean;
  } = {},
) => {
  const { apiClient } = useFarcasterApiClient();
  const { enabled = true } = options;

  return useQuery({
    queryKey: buildFeaturedHeroAppsKey(params),
    queryFn: buildFeaturedHeroAppsFetcher({ apiClient, params }),
    staleTime: MILLIS_PER_HOUR,
    enabled,
  });
};

export { useFeaturedHeroApps };
