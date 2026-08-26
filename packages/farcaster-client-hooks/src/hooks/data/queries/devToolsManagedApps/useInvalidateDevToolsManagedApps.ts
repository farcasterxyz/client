import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDevToolsManagedAppsKey } from './buildDevToolsManagedAppsKey';

export function useInvalidateDevToolsManagedApps() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildDevToolsManagedAppsKey(),
    });
  }, [queryClient]);
}
