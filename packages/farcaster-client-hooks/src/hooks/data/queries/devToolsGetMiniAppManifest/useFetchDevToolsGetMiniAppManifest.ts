import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsGetMiniAppManifestFetcher } from './buildDevToolsGetMiniAppManifestFetcher';

const useFetchDevToolsGetMiniAppManifest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ id }: { id: string | undefined }) => {
      if (!id) {
        return null;
      }

      const result = await buildDevToolsGetMiniAppManifestFetcher({
        apiClient,
        id,
      })();

      return result;
    },
    [apiClient],
  );
};

export { useFetchDevToolsGetMiniAppManifest };
