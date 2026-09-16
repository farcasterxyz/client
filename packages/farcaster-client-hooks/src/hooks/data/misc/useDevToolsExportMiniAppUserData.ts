import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsExportMiniAppUserData = () => {
  const { apiClient } = useFarcasterApiClient();
  return useCallback(
    async ({ domain }: { domain: string }) => {
      const response = await apiClient.devToolsExportMiniAppUserData({
        domain,
      });
      return response.data as unknown as string;
    },
    [apiClient],
  );
};

export { useDevToolsExportMiniAppUserData };
