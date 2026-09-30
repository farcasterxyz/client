import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildStorageUtilizationKey } from './buildStorageUtilizationKey';

const useInvalidateStorageUtilization = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildStorageUtilizationKey(),
    });
  }, [queryClient]);
};

export { useInvalidateStorageUtilization };
