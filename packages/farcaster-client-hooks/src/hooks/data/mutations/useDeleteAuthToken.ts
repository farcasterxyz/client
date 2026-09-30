import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDeleteAuthToken = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    const response = await apiClient.deleteAuthToken();
    return response.data;
  }, [apiClient]);
};

export { useDeleteAuthToken };
