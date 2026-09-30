import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useCompletePeerToPeerPayment = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (...args: Parameters<typeof apiClient.completePeerToPeerPayment>) => {
      const { data } = await apiClient.completePeerToPeerPayment(...args);
      return data.result;
    },
    [apiClient],
  );
};
