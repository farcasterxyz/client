import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsRefreshOpenGraphMetadata = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ url }: { url: string }) => {
      await apiClient.devToolsRefreshOpenGraphMetadata({
        url,
      });
    },
    [apiClient],
  );
};

export { useDevToolsRefreshOpenGraphMetadata };
