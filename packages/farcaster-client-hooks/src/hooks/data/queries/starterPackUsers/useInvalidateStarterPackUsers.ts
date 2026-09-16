import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildStarterPackUsersKey } from './buildStarterPackUsersKey';

const useInvalidateStarterPackUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ id }: { id: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildStarterPackUsersKey({ id }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateStarterPackUsers };
