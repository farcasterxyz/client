import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAllStarterPacksKey } from './buildAllStarterPacksKey';

const useInvalidateAllStarterPacks = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildAllStarterPacksKey(),
    });
  }, [queryClient]);
};

export { useInvalidateAllStarterPacks };
