import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildConnectedAccountsKey } from './buildConnectedAccountsKey';

const useInvalidateConnectedAccounts = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildConnectedAccountsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateConnectedAccounts };
