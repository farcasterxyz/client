import { ApiTransactionType } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { generateIdempotencyKey } from '../../../utils/AccountingUtils';

export const useFarcasterProSubscribeWithUsdc = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      chainId,
      txHash,
      subscriptionType,
      usdcAmount,
      durationInDays,
      transactionType,
    }: {
      chainId: number;
      txHash: string;
      subscriptionType: 'farcaster-pro';
      usdcAmount: number;
      durationInDays: number;
      transactionType: ApiTransactionType;
    }) => {
      const idempotencyKey = generateIdempotencyKey();
      const response = await apiClient.farcasterProSubscribeWithUsdc({
        chainId,
        txHash,
        subscriptionType,
        durationInDays,
        usdcAmount,
        idempotencyKey,
        transactionType,
      });

      return response.data.result.workflowId;
    },
    [apiClient],
  );
};
