import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildPrimaryAddressFetcher } from './buildPrimaryAddressFetcher';

const useFetchPrimaryAddress = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ fid }: { fid: number }) => {
      return await buildPrimaryAddressFetcher({
        apiClient,
        params: { fid },
      })();
    },
    [apiClient],
  );
};

export { useFetchPrimaryAddress };
