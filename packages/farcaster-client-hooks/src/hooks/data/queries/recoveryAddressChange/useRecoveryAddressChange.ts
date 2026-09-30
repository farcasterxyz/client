import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import {
  ApiGetRecoveryAddressChange200Response,
  ApiGetRecoveryAddressChangeQueryParams,
} from 'farcaster-client-data';
import { useEffect } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useInvalidateRecoveryAddress } from '../recoveryAddress/useInvalidateRecoveryAddress';
import { buildRecoveryAddressChangeFetcher } from './buildRecoveryAddressChangeFetcher';
import { buildRecoveryAddressChangeKey } from './buildRecoveryAddressChangeKey';

const useRecoveryAddressChange = (
  params: ApiGetRecoveryAddressChangeQueryParams,
  options?: Omit<
    UseSuspenseQueryOptions<
      ApiGetRecoveryAddressChange200Response,
      unknown,
      ApiGetRecoveryAddressChange200Response,
      string[]
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateRecoveryAddress = useInvalidateRecoveryAddress();

  const result = useSuspenseQuery({
    queryKey: buildRecoveryAddressChangeKey(params),
    queryFn: buildRecoveryAddressChangeFetcher({ apiClient, params }),
    ...options,
  });

  // When a recovery address change completes invalidate recovery address
  useEffect(() => {
    if (result.data?.result.recoveryAddressChange.completedAt) {
      invalidateRecoveryAddress();
    }
  }, [result.data, invalidateRecoveryAddress]);

  return result;
};

export { useRecoveryAddressChange };
