import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsRegisterDomain = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ domain }: { domain: string }) => {
      const response = await apiClient.devToolsRegisterDomain({
        domain,
      });
      return response.data.result.state;
    },
    [apiClient],
  );
};

export { useDevToolsRegisterDomain };
