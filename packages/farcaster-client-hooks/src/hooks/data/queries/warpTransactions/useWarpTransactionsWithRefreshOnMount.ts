import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildWarpTransactionsKey } from './buildWarpTransactionsKey';
import { useInvalidateWarpTransactions } from './useInvalidateWarpTransactions';
import { useWarpTransactions } from './useWarpTransactions';

const useWarpTransactionsWithRefreshOnMount = () => {
  const initialValue = useWarpTransactions();

  const queryKey = useMemo(() => buildWarpTransactionsKey(), []);

  const invalidateWarpTransactions = useInvalidateWarpTransactions();
  const invalidate = useCallback(() => {
    invalidateWarpTransactions();
  }, [invalidateWarpTransactions]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useWarpTransactionsWithRefreshOnMount };
