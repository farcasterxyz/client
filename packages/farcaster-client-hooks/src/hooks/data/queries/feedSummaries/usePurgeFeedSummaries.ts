import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildFeedSummariesKey } from './buildFeedSummariesKey';

const usePurgeFeedSummaries = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.removeQueries({
      queryKey: buildFeedSummariesKey(),
    });
  }, [queryClient]);
};

export { usePurgeFeedSummaries };
