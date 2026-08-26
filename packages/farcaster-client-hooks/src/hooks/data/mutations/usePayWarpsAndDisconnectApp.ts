import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { generateIdempotencyKey } from '../../../utils/AccountingUtils';

export const usePayWarpsAndDisconnectApp = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      warpsOfferingToken,
      publicKey,
      deadline,
      signature,
    }: {
      warpsOfferingToken: string;
      publicKey: string;
      deadline: number;
      signature: string;
    }) => {
      const idempotencyKey = generateIdempotencyKey();

      const { data } = await apiClient.payWarpsAndDisconnectApp({
        warpsIdempotencyKey: idempotencyKey,
        warpsOfferingToken: warpsOfferingToken,
        publicKey,
        signature,
        deadline,
      });

      return data.result;
    },
    [apiClient],
  );
};
