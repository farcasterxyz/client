import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

type ApiRentTransactionData = {
  chainId: string;
  method: 'eth_sendTransaction';
  params: {
    functionSignature: string;
    to: string;
    data: string;
    value: string;
  };
};

const useRentTransactionData = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ fid, units }: { fid: number; units: number }) => {
      const response = await apiClient.rentTransactionData(
        {
          fid,
          units,
        },
        {
          // This endpoint is a query-only POST. React Native can otherwise infer
          // application/octet-stream for the empty body, which the backend rejects.
          headers: {
            'Content-Type': 'text/plain',
          },
        },
      );

      return response.data as unknown as ApiRentTransactionData;
    },
    [apiClient],
  );
};

export type { ApiRentTransactionData };
export { useRentTransactionData };
