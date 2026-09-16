import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildCastRecastersKey } from './buildCastRecastersKey';
import { useCastRecasters } from './useCastRecasters';
import { useInvalidateCastRecasters } from './useInvalidateCastRecasters';

const useCastRecastersWithRefreshOnMount = ({
  castHash,
}: {
  castHash: string;
}) => {
  const initialValue = useCastRecasters({ castHash });

  const queryKey = useMemo(
    () => buildCastRecastersKey({ castHash }),
    [castHash],
  );

  const invalidateCastRecasters = useInvalidateCastRecasters();
  const invalidate = useCallback(() => {
    invalidateCastRecasters({ castHash });
  }, [castHash, invalidateCastRecasters]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useCastRecastersWithRefreshOnMount };
