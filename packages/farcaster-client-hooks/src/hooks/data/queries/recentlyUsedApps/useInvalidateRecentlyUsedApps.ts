import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildRecentlyUsedAppsKey } from './buildRecentlyUsedAppsKey';

const useInvalidateRecentlyUsedApps = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ limit }: { limit?: number } = {}) => {
      queryClient.invalidateQueries({
        queryKey: buildRecentlyUsedAppsKey({ limit }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateRecentlyUsedApps };
