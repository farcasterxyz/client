import { useQueryClient } from '@tanstack/react-query';
import { ApiRecordWalletTransactionRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import {
  useInvalidateTokenHolders,
  useInvalidateTokenWalletContext,
} from '../queries';
import { useInvalidateWalletActivity } from '../queries/walletActivity/useInvalidateWalletActivity';

const useRecordWalletTransaction = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const invalidateTokenWalletContext = useInvalidateTokenWalletContext();
  const invalidateWalletActivity = useInvalidateWalletActivity();
  const invalidateTokenHolders = useInvalidateTokenHolders();

  return useCallback(
    async ({ params }: { params: ApiRecordWalletTransactionRequestBody }) => {
      await apiClient.recordWalletTransaction(params);

      setTimeout(() => {
        if (params.metadata?.type === 'swap-v2') {
          invalidateTokenWalletContext({
            ca: params.metadata.buyToken.ca,
            chain: params.metadata.buyToken.chain,
          });
          invalidateTokenWalletContext({
            ca: params.metadata.sellToken.ca,
            chain: params.metadata.sellToken.chain,
          });
          invalidateTokenHolders({
            ca: params.metadata.buyToken.ca,
            chain: params.metadata.buyToken.chain,
          });
          invalidateTokenHolders({
            ca: params.metadata.sellToken.ca,
            chain: params.metadata.sellToken.chain,
          });

          invalidateWalletActivity({});

          // This is in expo, weird to do it here but works for now.
          queryClient.invalidateQueries({
            queryKey: ['onchainBalance'],
          });
        }
        // janky workaround for stale reads right
      }, 250);
    },
    [
      apiClient,
      invalidateTokenWalletContext,
      invalidateWalletActivity,
      invalidateTokenHolders,
      queryClient,
    ],
  );
};

export { useRecordWalletTransaction };
