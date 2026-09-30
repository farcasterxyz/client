import { ApiGetRecoveryQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRecoveryFetcher } from './buildRecoveryFetcher';

const useFetchRecovery = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (params: ApiGetRecoveryQueryParams) => {
      const data = await buildRecoveryFetcher({
        apiClient,
        params,
      })();

      return data;
    },
    [apiClient],
  );
};

export { useFetchRecovery };
