import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDirectCastUsersKey } from './buildDirectCastUsersKey';

const useInvalidateDirectCastUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ q }: { q: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildDirectCastUsersKey({ q }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateDirectCastUsers };
