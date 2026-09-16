import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOnchainYieldOverviewFetcher } from './buildOnchainYieldOverviewFetcher';
import { buildOnchainYieldOverviewKey } from './buildOnchainYieldOverviewKey';

export const useOnchainYieldOverview = ({
  address,
  enabled = true,
}: {
  address: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildOnchainYieldOverviewKey({ address }),
    queryFn: buildOnchainYieldOverviewFetcher({ address, apiClient }),
    enabled,
  });
};
