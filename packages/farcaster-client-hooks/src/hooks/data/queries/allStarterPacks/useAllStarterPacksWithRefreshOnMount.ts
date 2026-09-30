import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildAllStarterPacksKey } from './buildAllStarterPacksKey';
import { useAllStarterPacks } from './useAllStarterPacks';
import { useInvalidateAllStarterPacks } from './useInvalidateAllStarterPacks';

const useAllStarterPacksWithRefreshOnMount = () => {
  const initialValue = useAllStarterPacks();

  const queryKey = useMemo(() => buildAllStarterPacksKey(), []);

  const invalidateAllStarterPacks = useInvalidateAllStarterPacks();

  const invalidate = useCallback(() => {
    invalidateAllStarterPacks();
  }, [invalidateAllStarterPacks]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useAllStarterPacksWithRefreshOnMount };
