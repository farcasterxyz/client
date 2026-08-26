import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSimulateRentStorage = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ units }: { units: number }) => {
      const response = await apiClient.simulateRentStorage({
        units: units,
      });

      return response.data;
    },
    [apiClient],
  );
};

export { useSimulateRentStorage };
