import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildFollowersKey } from './buildFollowersKey';
import { useFollowers } from './useFollowers';
import { useInvalidateFollowers } from './useInvalidateFollowers';

const useFollowersWithRefreshOnMount = ({ fid }: { fid: number }) => {
  const initialValue = useFollowers({ fid });

  const queryKey = useMemo(() => buildFollowersKey({ fid }), [fid]);

  const invalidateFollowers = useInvalidateFollowers();
  const invalidate = useCallback(() => {
    invalidateFollowers({ fid });
  }, [fid, invalidateFollowers]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useFollowersWithRefreshOnMount };
