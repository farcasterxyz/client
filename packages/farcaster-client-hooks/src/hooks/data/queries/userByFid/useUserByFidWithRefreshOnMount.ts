import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildUserByFidKey } from './buildUserByFidKey';
import { useInvalidateUserByFid } from './useInvalidateUserByFid';
import { useUserByFid } from './useUserByFid';

const useUserByFidWithRefreshOnMount = ({ fid }: { fid: number }) => {
  const initialValue = useUserByFid({ fid });

  const queryKey = useMemo(() => buildUserByFidKey({ fid }), [fid]);

  const invalidateUser = useInvalidateUserByFid();
  const invalidate = useCallback(() => {
    invalidateUser({ fid });
  }, [fid, invalidateUser]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useUserByFidWithRefreshOnMount };
