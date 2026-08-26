import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildBidOnCastCollectibleFetcher } from './buildBidOnCastCollectibleFetcher';
import { buildBidOnCastCollectibleKey } from './buildBidOnCastCollectibleKey';

const useFetchBidTransactionData = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(
    ({
      castHash,
      bidderAddress,
      bidAmount,
      permit,
    }: {
      castHash: string;
      bidderAddress: string;
      bidAmount: string;
      permit: {
        signature: string;
        deadline: number;
      };
    }) => {
      const queryKey = buildBidOnCastCollectibleKey({
        castHash,
        bidderAddress,
        bidAmount,
        permit,
      });

      return queryClient.fetchQuery({
        queryKey,
        queryFn: buildBidOnCastCollectibleFetcher({
          apiClient,
          castHash,
          bidderAddress,
          bidAmount,
          permit,
        }),
      });
    },
    [apiClient, queryClient],
  );
};
export { useFetchBidTransactionData };
