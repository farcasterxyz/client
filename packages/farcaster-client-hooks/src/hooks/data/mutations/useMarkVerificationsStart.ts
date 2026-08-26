import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useMarkVerificationsStart = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    const response = await apiClient.markVerificationsStart();

    return response.data;
  }, [apiClient]);
};

export { useMarkVerificationsStart };
