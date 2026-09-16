import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildBookmarkedCastsKey } from './buildBookmarkedCastsKey';
import { useBookmarkedCasts } from './useBookmarkedCasts';
import { useInvalidateBookmarkedCasts } from './useInvalidateBookmarkedCasts';

const useBookmarkedCastsWithRefreshOnMount = () => {
  const initialValue = useBookmarkedCasts();

  const queryKey = useMemo(() => buildBookmarkedCastsKey(), []);

  const invalidateBookmarkedCasts = useInvalidateBookmarkedCasts();
  const invalidate = useCallback(() => {
    invalidateBookmarkedCasts();
  }, [invalidateBookmarkedCasts]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useBookmarkedCastsWithRefreshOnMount };
