import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';

const useFetchThread = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ castHash, limit }: { castHash: string; limit: number }) => {
      const result = await apiClient.getThread({ castHash, limit });
      return result.data.result;
    },
    [apiClient],
  );
};

export { useFetchThread };
