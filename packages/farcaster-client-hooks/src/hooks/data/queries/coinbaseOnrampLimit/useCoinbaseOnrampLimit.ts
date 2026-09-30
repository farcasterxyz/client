import { NetworkMode, useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildCoinbaseOnrampLimitKey } from './buildCoinbaseOnrampLimitKey';

const useCoinbaseOnrampLimit = ({
  fidOverride,
  enabled = true,
}: {
  fidOverride?: number;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    staleTime: 1000 * 60 * 15, // 15 minutes
    networkMode: 'offlineFirst' as NetworkMode,
    queryKey: buildCoinbaseOnrampLimitKey({ fidOverride }),
    queryFn: async () => {
      const response = await apiClient.getCoinbaseOnrampLimit({
        fidOverride,
      });
      return response.data.result;
    },
    enabled,
  });

  return result;
};

export { useCoinbaseOnrampLimit };
