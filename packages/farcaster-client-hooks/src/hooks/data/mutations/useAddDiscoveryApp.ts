import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useAddDiscoveryApp = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (...args: Parameters<typeof apiClient.addDiscoveryApp>) => {
      const { data } = await apiClient.addDiscoveryApp(...args);
      return data.result;
    },
    [apiClient],
  );
};
