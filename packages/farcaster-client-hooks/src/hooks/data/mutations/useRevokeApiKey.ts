import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateApiKeys } from '../queries/apiKeys/useInvalidateApiKeys';

export const useRevokeApiKey = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateApiKeys = useInvalidateApiKeys();

  return useCallback(
    async (...args: Parameters<typeof apiClient.revokeApiKey>) => {
      const { data } = await apiClient.revokeApiKey(...args);
      invalidateApiKeys();
      return data.result;
    },
    [apiClient, invalidateApiKeys],
  );
};
