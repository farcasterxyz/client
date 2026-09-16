import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildThreadKey } from './buildThreadKey';
import { useInvalidateThread } from './useInvalidateThread';
import { useNonSuspenseThread } from './useThread';

const useThreadWithRefreshOnMount = ({ castHash }: { castHash: string }) => {
  const initialValue = useNonSuspenseThread({ castHash });

  const queryKey = useMemo(() => buildThreadKey({ castHash }), [castHash]);
  const invalidateThread = useInvalidateThread();
  const invalidate = useCallback(() => {
    invalidateThread({ castHash });
  }, [invalidateThread, castHash]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useThreadWithRefreshOnMount };
