import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildTopMiniAppsKey } from './buildTopMiniAppsKey';

export const useInvalidateTopMiniApps = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildTopMiniAppsKey(),
    });
  }, [queryClient]);
};
