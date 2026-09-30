import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildFrameBlocklistKey } from './buildFrameBlocklistKey';

export const useInvalidateFrameBlocklist = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildFrameBlocklistKey(),
    });
  }, [queryClient]);
};
