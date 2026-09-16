import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildConnectedAccountsKey } from './buildConnectedAccountsKey';
import { useConnectedAccounts } from './useConnectedAccounts';
import { useInvalidateConnectedAccounts } from './useInvalidateConnectedAccounts';

const useConnectedAccountsWithRefreshOnMount = () => {
  const initialValue = useConnectedAccounts();

  const queryKey = useMemo(() => buildConnectedAccountsKey(), []);

  const invalidateConnectedAccounts = useInvalidateConnectedAccounts();

  const invalidate = useCallback(() => {
    invalidateConnectedAccounts();
  }, [invalidateConnectedAccounts]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useConnectedAccountsWithRefreshOnMount };
