import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useRejectRecovery = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    await apiClient.rejectRecovery();
  }, [apiClient]);
};

export { useRejectRecovery };
