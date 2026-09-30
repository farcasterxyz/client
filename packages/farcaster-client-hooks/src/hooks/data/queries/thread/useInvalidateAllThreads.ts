import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildThreadKey } from './buildThreadKey';

const useInvalidateAllThreads = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildThreadKey({
        castHash: undefined,
      }),
    });
  }, [queryClient]);
};

export { useInvalidateAllThreads };
