import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useValidateFrameEmbedV2 = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ url }: { url: string }) => {
      const response = await apiClient.validateFrameEmbedV2({ url });
      return response.data;
    },
    [apiClient],
  );
};

export { useValidateFrameEmbedV2 };
