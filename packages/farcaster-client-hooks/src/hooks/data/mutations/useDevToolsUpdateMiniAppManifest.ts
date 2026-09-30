import { ApiDomainManifest } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsUpdateMiniAppManifest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ id, manifest }: { id: string; manifest: ApiDomainManifest }) => {
      const { data } = await apiClient.devToolsUpdateMiniAppManifest({
        id,
        manifest,
      });
      return data?.result.success;
    },
    [apiClient],
  );
};

export { useDevToolsUpdateMiniAppManifest };
