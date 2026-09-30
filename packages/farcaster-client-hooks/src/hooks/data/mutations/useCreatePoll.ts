import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useCreatePoll = () => {
  const { apiClient } = useFarcasterApiClient();
  return useCallback(
    async (...args: Parameters<typeof apiClient.createPoll>) => {
      const { data } = await apiClient.createPoll(...args);
      return data.result;
    },
    [apiClient],
  );
};
