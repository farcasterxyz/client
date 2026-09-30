import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ApiGetUserAuthAddress200Response } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildUserAuthAddressFetcher } from './buildUserAuthAddressFetcher';
import { buildUserAuthAddressKey } from './buildUserAuthAddressKey';

const useUserAuthAddress = (
  options?: Omit<
    UseQueryOptions<
      ApiGetUserAuthAddress200Response['result'],
      unknown,
      ApiGetUserAuthAddress200Response['result'],
      string[]
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildUserAuthAddressKey(),
    queryFn: buildUserAuthAddressFetcher({
      apiClient,
    }),
    ...options,
  });
};

export { useUserAuthAddress };
