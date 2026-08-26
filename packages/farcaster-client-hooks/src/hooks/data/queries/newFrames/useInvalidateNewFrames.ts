import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildNewFramesKey } from './buildNewFramesKey';

export function useInvalidateNewFrames() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildNewFramesKey(),
    });
  }, [queryClient]);
}
