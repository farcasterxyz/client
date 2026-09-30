import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  ApiGetRecovery200Response,
  ApiGetRecoveryQueryParams,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRecoveryFetcher } from './buildRecoveryFetcher';
import { buildRecoveryKey } from './buildRecoveryKey';

const useRecovery = (
  params: ApiGetRecoveryQueryParams,
  options?: Omit<
    UseQueryOptions<
      ApiGetRecovery200Response,
      unknown,
      ApiGetRecovery200Response,
      string[]
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildRecoveryKey(params),
    queryFn: buildRecoveryFetcher({ apiClient, params }),
    ...options,
  });
};

export { useRecovery };
