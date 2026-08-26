import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildRecoveryAddressKey } from './buildRecoveryAddressKey';

const useInvalidateRecoveryAddress = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildRecoveryAddressKey(),
    });
  }, [queryClient]);
};

export { useInvalidateRecoveryAddress };
