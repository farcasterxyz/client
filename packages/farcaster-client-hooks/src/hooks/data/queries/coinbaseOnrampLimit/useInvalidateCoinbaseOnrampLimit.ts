import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildCoinbaseOnrampLimitKey } from './buildCoinbaseOnrampLimitKey';

const useInvalidateCoinbaseOnrampLimit = () => {
  const queryClient = useQueryClient();

  const invalidateCoinbaseOnrampLimit = useCallback(
    ({ fidOverride }: { fidOverride?: number }) => {
      return queryClient.invalidateQueries({
        queryKey: buildCoinbaseOnrampLimitKey({ fidOverride }),
      });
    },
    [queryClient],
  );

  return { invalidateCoinbaseOnrampLimit };
};

export { useInvalidateCoinbaseOnrampLimit };
