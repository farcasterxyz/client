import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildUserByUsernameKey } from './buildUserByUsernameKey';
import { useInvalidateUserByUsername } from './useInvalidateUserByUsername';
import { useUserByUsername } from './useUserByUsername';

const useUserByUsernameWithRefreshOnMount = ({
  username,
}: {
  username: string;
}) => {
  const initialValue = useUserByUsername({ username });

  const queryKey = useMemo(
    () => buildUserByUsernameKey({ username }),
    [username],
  );

  const invalidateUser = useInvalidateUserByUsername();
  const invalidate = useCallback(() => {
    invalidateUser({ username });
  }, [username, invalidateUser]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useUserByUsernameWithRefreshOnMount };
