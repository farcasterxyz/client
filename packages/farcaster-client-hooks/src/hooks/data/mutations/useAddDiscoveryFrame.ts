import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useAddDiscoveryFrame = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (...args: Parameters<typeof apiClient.addDiscoveryFrame>) => {
      const { data } = await apiClient.addDiscoveryFrame(...args);
      return data.result;
    },
    [apiClient],
  );
};
