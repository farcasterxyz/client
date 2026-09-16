import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildBookmarkedCastsKey } from './buildBookmarkedCastsKey';

const useInvalidateBookmarkedCasts = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildBookmarkedCastsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateBookmarkedCasts };
