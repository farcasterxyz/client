import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildFollowingKey } from './buildFollowingKey';
import { useFollowing, useNonSuspenseFollowing } from './useFollowing';
import { useInvalidateFollowing } from './useInvalidateFollowing';

const useFollowingWithRefreshOnMount = ({ fid }: { fid: number }) => {
  const initialValue = useFollowing({ fid });

  const queryKey = useMemo(() => buildFollowingKey({ fid }), [fid]);

  const invalidateFollowing = useInvalidateFollowing();
  const invalidate = useCallback(() => {
    invalidateFollowing({ fid });
  }, [fid, invalidateFollowing]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

const useNonSuspenseFollowingWithRefreshOnMount = ({
  fid,
}: {
  fid: number;
}) => {
  const initialValue = useNonSuspenseFollowing({ fid });

  const queryKey = useMemo(() => buildFollowingKey({ fid }), [fid]);

  const invalidateFollowing = useInvalidateFollowing();
  const invalidate = useCallback(() => {
    invalidateFollowing({ fid });
  }, [fid, invalidateFollowing]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export {
  useFollowingWithRefreshOnMount,
  useNonSuspenseFollowingWithRefreshOnMount,
};
