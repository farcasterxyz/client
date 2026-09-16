import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildUserLikedCastsKey } from './buildUserLikedCastsKey';
import { useInvalidateUserLikedCasts } from './useInvalidateUserLikedCasts';
import { useUserLikedCasts } from './useUserLikedCasts';

const useUserLikedCastsWithRefreshOnMount = ({ fid }: { fid: number }) => {
  const initialValue = useUserLikedCasts({
    fid,
  });

  const queryKey = useMemo(() => buildUserLikedCastsKey({ fid }), [fid]);

  const invalidateUserLikedCasts = useInvalidateUserLikedCasts();
  const invalidate = useCallback(() => {
    invalidateUserLikedCasts({ fid });
  }, [fid, invalidateUserLikedCasts]);

  return useQueryWithRefreshOnMount({
    initialValue,
    queryKey,
    invalidate,
  });
};

export { useUserLikedCastsWithRefreshOnMount };
