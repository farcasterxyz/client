import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOnchainYieldWithdrawFetcher } from './buildOnchainYieldWithdrawFetcher';
import { buildOnchainYieldWithdrawKey } from './buildOnchainYieldWithdrawKey';

export const useOnchainYieldWithdraw = ({
  address,
  amount,
  enabled = true,
}: {
  address: string;
  amount?: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildOnchainYieldWithdrawKey({ address, amount }),
    queryFn: buildOnchainYieldWithdrawFetcher({ address, amount, apiClient }),
    enabled,
  });
};
