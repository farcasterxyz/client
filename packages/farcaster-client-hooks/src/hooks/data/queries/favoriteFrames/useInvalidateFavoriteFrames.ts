import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildFavoriteFramesKey } from './buildFavoriteFramesKey';

export function useInvalidateFavoriteFrames() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildFavoriteFramesKey(),
    });
  }, [queryClient]);
}
