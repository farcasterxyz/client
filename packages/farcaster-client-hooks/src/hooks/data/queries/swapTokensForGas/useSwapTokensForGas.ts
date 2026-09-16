import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildSwapTokensForGasFetcher } from './buildSwapTokensForGasFetcher';
import { buildSwapTokensForGasKey } from './buildSwapTokensForGasKey';

const useSwapTokensForGas = ({
  chainId,
  sellAmountBaseUnits,
  sellToken,
  walletId,
  enabled = true,
}: {
  chainId?: number;
  sellAmountBaseUnits?: string;
  sellToken?: string;
  walletId?: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  return useQuery({
    queryKey: buildSwapTokensForGasKey({
      chainId,
      sellAmountBaseUnits,
      sellToken,
      walletId,
    }),
    queryFn: buildSwapTokensForGasFetcher({
      chainId,
      sellAmountBaseUnits,
      sellToken,
      walletId,
      apiClient,
    }),
    refetchInterval: 60 * 1000, // 1 minute in milliseconds
    enabled: enabled && !!chainId,
    refetchOnMount: true,
    staleTime: 0,
  });
};

export { useSwapTokensForGas };
