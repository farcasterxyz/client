import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildContactsUsersKey } from './buildContactsUsersKey';
import { useContactsUsers } from './useContactsUsers';
import { useInvalidateContactsUsers } from './useInvalidateContactsUsers';

const useContactsUsersWithRefreshOnMount = () => {
  const initialValue = useContactsUsers();

  const queryKey = useMemo(() => buildContactsUsersKey(), []);

  const invalidateContactsUsers = useInvalidateContactsUsers();
  const invalidate = useCallback(() => {
    invalidateContactsUsers();
  }, [invalidateContactsUsers]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useContactsUsersWithRefreshOnMount };
