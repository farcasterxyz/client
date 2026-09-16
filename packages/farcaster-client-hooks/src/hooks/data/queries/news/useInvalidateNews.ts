import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildNewsKey } from './buildNewsKey';

const useInvalidateNews = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildNewsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateNews };
