import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserAuthAddressKey } from './buildUserAuthAddressKey';

const useInvalidateUserAuthAddress = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildUserAuthAddressKey(),
    });
  }, [queryClient]);
};

export { useInvalidateUserAuthAddress };
