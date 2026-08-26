import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useBuyWarpsCoinbaseCommerce = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      amount,
      idempotencyKey,
    }: {
      amount: number;
      idempotencyKey: string;
    }) => {
      return await apiClient.buyWarpsCoinbaseCommerce({
        amount,
        idempotencyKey,
      });
    },
    [apiClient],
  );
};

export { useBuyWarpsCoinbaseCommerce };
