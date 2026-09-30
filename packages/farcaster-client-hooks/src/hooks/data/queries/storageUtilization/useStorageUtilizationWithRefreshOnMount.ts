import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildStorageUtilizationKey } from './buildStorageUtilizationKey';
import { useInvalidateStorageUtilization } from './useInvalidateStorageUtilization';
import { useStorageUtilization } from './useStorageUtilization';

const useStorageUtilizationWithRefreshOnMount = () => {
  const initialValue = useStorageUtilization();

  const queryKey = useMemo(() => buildStorageUtilizationKey(), []);

  const invalidateStorageUtilization = useInvalidateStorageUtilization();
  const invalidate = useCallback(() => {
    invalidateStorageUtilization();
  }, [invalidateStorageUtilization]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useStorageUtilizationWithRefreshOnMount };
