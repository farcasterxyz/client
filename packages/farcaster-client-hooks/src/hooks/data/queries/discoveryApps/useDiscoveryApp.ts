import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import {
  ApiGetDiscoveryApp200Response,
  ApiGetDiscoveryAppQueryParams,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDiscoveryAppFetcher } from './buildDiscoveryAppFetcher';
import { buildDiscoveryAppKey } from './buildDiscoveryAppKey';

const useDiscoveryApp = (
  params: ApiGetDiscoveryAppQueryParams,
  options?: UseSuspenseQueryOptions<
    ApiGetDiscoveryApp200Response,
    unknown,
    ApiGetDiscoveryApp200Response,
    string[]
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseQuery({
    queryKey: buildDiscoveryAppKey(params),
    queryFn: buildDiscoveryAppFetcher({ apiClient, params }),
    ...options,
  });

  return result;
};

export { useDiscoveryApp };
