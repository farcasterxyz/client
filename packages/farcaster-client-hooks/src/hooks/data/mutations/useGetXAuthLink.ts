import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useGetXAuthLink = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    const response = await apiClient.getXAuthLink();

    return response.data;
  }, [apiClient]);
};

export { useGetXAuthLink };
