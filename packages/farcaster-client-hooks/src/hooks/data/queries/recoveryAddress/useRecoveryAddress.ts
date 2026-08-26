import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRecoveryAddressFetcher } from './buildRecoveryAddressFetcher';
import { buildRecoveryAddressKey } from './buildRecoveryAddressKey';

export const useRecoveryAddress = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildRecoveryAddressKey(),
    queryFn: buildRecoveryAddressFetcher({ apiClient }),

    // always refetch in case the user changed their recovery address outside
    // of Warpcast
    staleTime: 0,
  });
};
