import { useQuery } from '@tanstack/react-query';

import { UseQueryParameters } from '../types';
import { buildClankerTokenFetcher } from './buildClankerTokenFetcher';
import { buildClankerTokenKey } from './buildClankerTokenKey';
import { ApiClankerToken, ApiGetClankerTokenQueryParams } from './types';

/**
 * Hook to fetch Clanker-specific token data.
 * Only returns data for tokens deployed via Clanker platform.
 *
 * @param params.ca - Contract address of the token
 * @param query - Optional React Query options
 * @param enabled - Whether to enable the query (default: true)
 */
const useClankerToken = ({
  params,
  query,
  enabled = true,
}: {
  params: ApiGetClankerTokenQueryParams;
  query?: UseQueryParameters<ApiClankerToken>;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: buildClankerTokenKey(params),
    queryFn: buildClankerTokenFetcher({ params }),
    enabled,
    // Cache for 5 minutes, stale after 1 minute
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    ...query,
  });
};

export { useClankerToken };
