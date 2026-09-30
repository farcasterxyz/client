import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useRentStorage = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      units,
      productPurchaseTrackingId,
    }: {
      units: number;
      productPurchaseTrackingId: string;
    }) => {
      const response = await apiClient.rentStorage({
        units: units,
        productPurchaseTrackingId: productPurchaseTrackingId,
      });

      return response.data;
    },
    [apiClient],
  );
};

export { useRentStorage };
