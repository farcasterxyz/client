import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useProcessDirectCastMessageMetadata = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ message }: { message: string }) => {
      const response = await apiClient.processDirectCastMessageMetadata({
        message,
      });

      return response.data;
    },
    [apiClient],
  );
};

export { useProcessDirectCastMessageMetadata };
