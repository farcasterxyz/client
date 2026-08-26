import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsForceRefreshCastAttachments = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ hash }: { hash: string }) => {
      const response = await apiClient.devToolsForceRefreshCastAttachments({
        hash,
      });
      return response.data.result.cast;
    },
    [apiClient],
  );
};

export { useDevToolsForceRefreshCastAttachments };
