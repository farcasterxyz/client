import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useDeleteDiscoveryFrame = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (...args: Parameters<typeof apiClient.deleteDiscoveryFrame>) => {
      const { data } = await apiClient.deleteDiscoveryFrame(...args);
      return data.result;
    },
    [apiClient],
  );
};
