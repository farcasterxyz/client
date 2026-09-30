import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useMarkAllWarpTransactionsRead = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    return apiClient.markAllWarpTransactionsRead();
  }, [apiClient]);
};

export { useMarkAllWarpTransactionsRead };
