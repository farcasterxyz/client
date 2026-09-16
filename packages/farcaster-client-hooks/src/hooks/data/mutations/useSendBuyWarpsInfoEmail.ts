import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSendBuyWarpsInfoEmail = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    await apiClient.sendBuyWarpsInfoEmail();
  }, [apiClient]);
};

export { useSendBuyWarpsInfoEmail };
