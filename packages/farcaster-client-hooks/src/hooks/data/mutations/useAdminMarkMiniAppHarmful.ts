import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateFrameBlocklist } from '../queries/frameBlocklist';

const useAdminMarkMiniAppHarmful = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateFrameBlocklist = useInvalidateFrameBlocklist();

  return useCallback(
    async ({ domain }: { domain: string }) => {
      const response = await apiClient.adminMarkMiniAppHarmful({
        domain,
      });

      void invalidateFrameBlocklist();

      return response.data;
    },
    [apiClient, invalidateFrameBlocklist],
  );
};

export { useAdminMarkMiniAppHarmful };
