import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { WarpsTrade, WarpsTradeSchema } from './types';

export const useFetchWarpsDeal = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery<WarpsTrade, Error>({
    queryFn: async () => {
      const { data } = await apiClient.getWarpsTradeStatus();
      const parsed = WarpsTradeSchema.parse(data.result.status);
      return parsed;
    },
    refetchOnWindowFocus: true,
    queryKey: ['useFetchWarpsDeal'],
  });
};
