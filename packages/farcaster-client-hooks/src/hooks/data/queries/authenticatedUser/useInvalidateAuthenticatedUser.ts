import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAuthenticatedUserKey } from './buildAuthenticatedUserKey';

const useInvalidateAuthenticatedUser = () => {
  const queryClient = useQueryClient();

  const invalidateAuthenticatedUser = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildAuthenticatedUserKey(),
    });
  }, [queryClient]);

  return { invalidateAuthenticatedUser };
};

export { useInvalidateAuthenticatedUser };
