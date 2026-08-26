import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserUsernamesKey } from './buildUserUsernamesKey';

const useInvalidateUserUsernames = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildUserUsernamesKey(),
    });
  }, [queryClient]);
};

export { useInvalidateUserUsernames };
