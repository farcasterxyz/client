import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildUserKey } from './buildUserKey';
import { useInvalidateUser } from './useInvalidateUser';
import { useUser } from './useUser';

const useUserWithRefreshOnMount = ({
  fid,
  isCurrentUser = false,
}: {
  fid: number;
  isCurrentUser?: boolean;
}) => {
  const initialValue = useUser({ fid, isCurrentUser });

  const queryKey = useMemo(
    () => buildUserKey({ fid, isCurrentUser }),
    [fid, isCurrentUser],
  );

  const invalidateUser = useInvalidateUser();
  const invalidate = useCallback(() => {
    invalidateUser({ fid, isCurrentUser });
  }, [fid, isCurrentUser, invalidateUser]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useUserWithRefreshOnMount };
