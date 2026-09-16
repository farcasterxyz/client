import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useDeleteDiscoveryApp = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (...args: Parameters<typeof apiClient.deleteDiscoveryApp>) => {
      const { data } = await apiClient.deleteDiscoveryApp(...args);
      return data.result;
    },
    [apiClient],
  );
};
