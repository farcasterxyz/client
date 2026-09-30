import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsUnregisterDomain = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ domain }: { domain: string }) => {
      const response = await apiClient.devToolsUnregisterDomain({
        domain,
      });
      return response.data.result.success;
    },
    [apiClient],
  );
};

export { useDevToolsUnregisterDomain };
