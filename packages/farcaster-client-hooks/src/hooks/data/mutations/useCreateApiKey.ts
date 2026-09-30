import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateApiKeys } from '../queries/apiKeys/useInvalidateApiKeys';

export const useCreateApiKey = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateApiKeys = useInvalidateApiKeys();

  return useCallback(
    async (...args: Parameters<typeof apiClient.createApiKey>) => {
      const { data } = await apiClient.createApiKey(...args);
      invalidateApiKeys();
      return data.result;
    },
    [apiClient, invalidateApiKeys],
  );
};
