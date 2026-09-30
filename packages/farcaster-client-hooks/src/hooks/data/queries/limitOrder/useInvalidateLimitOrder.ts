import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildLimitOrderKey } from './buildLimitOrderKey';

const useInvalidateLimitOrder = () => {
  const queryClient = useQueryClient();

  const invalidateLimitOrder = useCallback(
    ({ orderId }: { orderId: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildLimitOrderKey({ orderId }),
      });
    },
    [queryClient],
  );

  return { invalidateLimitOrder };
};

export { useInvalidateLimitOrder };
