import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsDeleteMiniAppManifest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ id }: { id: string }) => {
      const { data } = await apiClient.devToolsDeleteMiniAppManifest({ id });
      return data?.result.success;
    },
    [apiClient],
  );
};

export { useDevToolsDeleteMiniAppManifest };
