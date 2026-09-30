import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserAppContextKey } from './buildUserAppContextKey';

const useInvalidateUserAppContext = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildUserAppContextKey(),
    });
  }, [queryClient]);
};

export { useInvalidateUserAppContext };
