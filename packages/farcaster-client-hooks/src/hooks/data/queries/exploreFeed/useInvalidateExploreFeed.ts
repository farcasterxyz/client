import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildExploreFeedKey } from './buildExploreFeedKey';

const useInvalidateExploreFeed = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildExploreFeedKey(),
    });
  }, [queryClient]);
};

export { useInvalidateExploreFeed };
