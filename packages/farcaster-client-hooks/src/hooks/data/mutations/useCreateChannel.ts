import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { generateIdempotencyKey } from '../../../utils/AccountingUtils';
import { useOptimisticallyAddSelfInRole } from '../channelUsers';

export const useCreateChannel = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyAddSelfInRole = useOptimisticallyAddSelfInRole();

  return useCallback(
    async ({
      key,
      transactionHash,
    }: {
      key: string;
      transactionHash: string;
    }) => {
      const idempotencyKey = generateIdempotencyKey();
      return await optimisticallyAddSelfInRole({
        channelKey: key,
        role: 'owner',
        execute: async () => {
          const response = await apiClient.createChannel({
            key,
            transactionHash,
            idempotencyKey,
          });

          return response.data.result;
        },
      });
    },
    [apiClient, optimisticallyAddSelfInRole],
  );
};
