import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOnchainYieldDepositFetcher } from './buildOnchainYieldDepositFetcher';
import { buildOnchainYieldDepositKey } from './buildOnchainYieldDepositKey';

export const useOnchainYieldDeposit = ({
  address,
  amount,
  enabled = true,
}: {
  address: string;
  amount: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildOnchainYieldDepositKey({ address, amount }),
    queryFn: buildOnchainYieldDepositFetcher({ address, amount, apiClient }),
    enabled,
  });
};
