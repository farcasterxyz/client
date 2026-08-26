import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildStarterPackFeedKey } from './buildStarterPackFeedKey';

const useInvalidateStarterPackFeed = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ id }: { id: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildStarterPackFeedKey({ id }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateStarterPackFeed };
