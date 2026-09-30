import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserByUsernameKey } from './buildUserByUsernameKey';

const useInvalidateUserByUsername = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ username }: { username: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildUserByUsernameKey({ username }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateUserByUsername };
