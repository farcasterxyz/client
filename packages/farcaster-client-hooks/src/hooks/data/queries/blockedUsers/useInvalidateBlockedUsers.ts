import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildBlockedUsersKey } from './buildBlockedUsersKey';

const useInvalidateBlockedUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildBlockedUsersKey(),
    });
  }, [queryClient]);
};

export { useInvalidateBlockedUsers };
