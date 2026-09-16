import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildFeedSummariesKey } from './buildFeedSummariesKey';

const useRefetchFeedSummaries = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: buildFeedSummariesKey(),
    });
  }, [queryClient]);
};

export { useRefetchFeedSummaries };
