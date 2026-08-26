import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildTrendingTopicsKey } from './buildTrendingTopicsKey';

const useInvalidateTrendingTopics = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildTrendingTopicsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateTrendingTopics };
