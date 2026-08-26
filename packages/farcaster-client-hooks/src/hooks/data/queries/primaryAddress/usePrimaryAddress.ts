import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { ApiGetPrimaryAddressQueryParams } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildPrimaryAddressFetcher } from './buildPrimaryAddressFetcher';
import { buildPrimaryAddressKey } from './buildPrimaryAddressKey';

const usePrimaryAddress = (params: ApiGetPrimaryAddressQueryParams) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildPrimaryAddressKey(params),
    queryFn: buildPrimaryAddressFetcher({ apiClient, params }),
  });
};

const useNonSuspensePrimaryAddress = (
  params: ApiGetPrimaryAddressQueryParams,
) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildPrimaryAddressKey(params),
    queryFn: buildPrimaryAddressFetcher({ apiClient, params }),
  });
};

export { useNonSuspensePrimaryAddress, usePrimaryAddress };
