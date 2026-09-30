import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildMutedUsersKey } from './buildMutedUsersKey';

const useInvalidateMutedUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildMutedUsersKey(),
    });
  }, [queryClient]);
};

export { useInvalidateMutedUsers };
