import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildTokenWatchlistsKey } from './buildTokenWatchlistsKey';

const useInvalidateTokenWatchlists = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildTokenWatchlistsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateTokenWatchlists };
