import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildTopFramesKey } from './buildTopFramesKey';

export function useInvalidateTopFrames() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildTopFramesKey(),
    });
  }, [queryClient]);
}
