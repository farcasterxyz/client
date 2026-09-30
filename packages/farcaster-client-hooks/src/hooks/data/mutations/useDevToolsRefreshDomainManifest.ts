import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsRefreshDomainManifest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ domain }: { domain: string }) => {
      const response = await apiClient.devToolsRefreshDomainManifest({
        domain,
      });
      return response.data.result.state;
    },
    [apiClient],
  );
};

export { useDevToolsRefreshDomainManifest };
