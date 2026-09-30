import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildWarpTransactionsKey } from './buildWarpTransactionsKey';

const useInvalidateWarpTransactions = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildWarpTransactionsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateWarpTransactions };
