import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useStartVerification = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    const response = await apiClient.startVerification();

    return response.data;
  }, [apiClient]);
};

export { useStartVerification };
