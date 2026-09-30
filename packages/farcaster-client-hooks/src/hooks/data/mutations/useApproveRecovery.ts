import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useApproveRecovery = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    await apiClient.approveRecovery();
  }, [apiClient]);
};

export { useApproveRecovery };
