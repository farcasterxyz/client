import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import {
  ApiGetDiscoveryFrame200Response,
  ApiGetDiscoveryFrameQueryParams,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDiscoveryFrameFetcher } from './buildDiscoveryFrameFetcher';
import { buildDiscoveryFrameKey } from './buildDiscoveryFrameKey';

const useDiscoveryFrame = (
  params: ApiGetDiscoveryFrameQueryParams,
  options?: UseSuspenseQueryOptions<
    ApiGetDiscoveryFrame200Response,
    unknown,
    ApiGetDiscoveryFrame200Response,
    string[]
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseQuery({
    queryKey: buildDiscoveryFrameKey(params),
    queryFn: buildDiscoveryFrameFetcher({ apiClient, params }),
    ...options,
  });

  return result;
};

export { useDiscoveryFrame };
