import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildContactsUsersKey } from './buildContactsUsersKey';

const useInvalidateContactsUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildContactsUsersKey(),
    });
  }, [queryClient]);
};

export { useInvalidateContactsUsers };
