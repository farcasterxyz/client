import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildGetNextNuxTaskKey } from './buildGetNextNuxTaskKey';

const useInvalidateNextNuxTask = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildGetNextNuxTaskKey(),
    });
  }, [queryClient]);
};

export { useInvalidateNextNuxTask };
