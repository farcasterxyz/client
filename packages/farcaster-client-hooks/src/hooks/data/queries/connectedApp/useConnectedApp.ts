import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import {
  ApiGetConnectedApp200Response,
  ApiGetConnectedAppQueryParams,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildConnectedAppFetcher } from './buildConnectedAppFetcher';
import { buildConnectedAppKey } from './buildConnectedAppKey';

const useConnectedApp = (
  params: ApiGetConnectedAppQueryParams,
  options?: Omit<
    UseSuspenseQueryOptions<
      ApiGetConnectedApp200Response['result'],
      unknown,
      ApiGetConnectedApp200Response['result'],
      string[]
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildConnectedAppKey(params),
    queryFn: buildConnectedAppFetcher({
      apiClient,
      params,
    }),
    ...options,
  });
};

export { useConnectedApp };
