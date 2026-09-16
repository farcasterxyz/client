import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildLeastInteractedWithFollowingKey } from './buildLeastInteractedWithFollowingKey';
import { useInvalidateLeastInteractedWithFollowing } from './useInvalidateLeastInteractedWithFollowing';
import { useLeastInteractedWithFollowing } from './useLeastInteractedWithFollowing';

const useLeastInteractedWithFollowingWithRefreshOnMount = () => {
  const initialValue = useLeastInteractedWithFollowing();

  const queryKey = useMemo(() => buildLeastInteractedWithFollowingKey(), []);

  const invalidateLeastInteractedWithFollowing =
    useInvalidateLeastInteractedWithFollowing();
  const invalidate = useCallback(() => {
    invalidateLeastInteractedWithFollowing();
  }, [invalidateLeastInteractedWithFollowing]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useLeastInteractedWithFollowingWithRefreshOnMount };
