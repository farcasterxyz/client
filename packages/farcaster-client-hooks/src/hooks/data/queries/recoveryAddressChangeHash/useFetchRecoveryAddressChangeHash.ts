import { ApiGetRecoveryAddressChangeHashQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRecoveryAddressChangeHashFetcher } from './buildRecoveryAddressChangeHashFetcher';

const useFetchRecoveryAddressChangeHash = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (params: ApiGetRecoveryAddressChangeHashQueryParams) => {
      const data = await buildRecoveryAddressChangeHashFetcher({
        apiClient,
        params,
      })();

      return data;
    },
    [apiClient],
  );
};

export { useFetchRecoveryAddressChangeHash };
