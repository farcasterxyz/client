import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildWalletActivityKey } from '../walletActivity/buildWalletActivityKey';
import { buildLimitOrdersKey } from './buildLimitOrdersKey';

export function useInvalidateLimitOrders() {
  const queryClient = useQueryClient();

  return useCallback(
    ({ statuses }: { statuses?: string } = {}) => {
      queryClient.invalidateQueries({
        queryKey: buildLimitOrdersKey({ statuses }),
      });
      queryClient.invalidateQueries({
        queryKey: buildWalletActivityKey(),
      });
    },
    [queryClient],
  );
}
