import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useRequestAccountDelete = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    await apiClient.requestAccountDelete();
  }, [apiClient]);
};

export { useRequestAccountDelete };
