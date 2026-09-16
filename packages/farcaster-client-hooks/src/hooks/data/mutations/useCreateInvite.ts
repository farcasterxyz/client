import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { generateIdempotencyKey } from '../../../utils/AccountingUtils';

export const useCreateInvite = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    const idempotencyKey = generateIdempotencyKey();

    const { data } = await apiClient.createInvite({
      idempotencyKey: idempotencyKey,
    });

    return data.result;
  }, [apiClient]);
};
