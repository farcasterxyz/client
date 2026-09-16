import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildFeedSummariesKey } from './buildFeedSummariesKey';

const useInvalidateFeedSummaries = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildFeedSummariesKey(),
    });
  }, [queryClient]);
};

export { useInvalidateFeedSummaries };
