import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildCastLikesKey } from './buildCastLikesKey';
import { useCastLikes } from './useCastLikes';
import { useInvalidateCastLikes } from './useInvalidateCastLikes';

const useCastLikesWithRefreshOnMount = ({ castHash }: { castHash: string }) => {
  const initialValue = useCastLikes({
    castHash,
  });

  const queryKey = useMemo(() => buildCastLikesKey({ castHash }), [castHash]);

  const invalidateCastLikes = useInvalidateCastLikes();
  const invalidate = useCallback(() => {
    invalidateCastLikes({ castHash });
  }, [castHash, invalidateCastLikes]);

  return useQueryWithRefreshOnMount({
    initialValue,
    queryKey,
    invalidate,
  });
};

export { useCastLikesWithRefreshOnMount };
