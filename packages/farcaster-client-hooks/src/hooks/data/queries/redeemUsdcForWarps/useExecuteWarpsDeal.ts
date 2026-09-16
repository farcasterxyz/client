import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { WarpsTrade, WarpsTradeSchema } from './types';

export const useExecuteWarpsDeal = (): UseMutationResult<
  { newStatus: WarpsTrade; isExecuted: boolean },
  Error,
  void
> => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useMutation<
    { newStatus: WarpsTrade; isExecuted: boolean },
    Error,
    void
  >({
    mutationFn: async () => {
      const { data } = await apiClient.executeWarpsTrade();
      const parsed = WarpsTradeSchema.parse(data.result.result.status);
      return {
        isExecuted: data.result.isExecuted,
        newStatus: parsed,
      };
    },
    mutationKey: ['useExecuteWarpsDeal'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useFetchWarpsDeal'] });
    },
  });
};
