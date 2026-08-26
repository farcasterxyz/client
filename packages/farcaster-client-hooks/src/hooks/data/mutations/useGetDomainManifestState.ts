import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export function useGetDomainManifestState() {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ domain, manifest }: { domain?: string; manifest?: string }) => {
      const response = await apiClient.getDomainManifestState({
        domain,
        manifest,
      });
      return response.data.result.state;
    },
    [apiClient],
  );
}
