import { ApiDomainManifest } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsStoreMiniAppManifest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ manifest }: { manifest: ApiDomainManifest }) => {
      const { data } = await apiClient.devToolsStoreMiniAppManifest({
        manifest,
      });
      return data?.result.id;
    },
    [apiClient],
  );
};

export { useDevToolsStoreMiniAppManifest };
