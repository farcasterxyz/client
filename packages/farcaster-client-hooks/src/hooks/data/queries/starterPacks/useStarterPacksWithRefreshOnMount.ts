import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildStarterPacksKey } from './buildStarterPacksKey';
import { useInvalidateStarterPacks } from './useInvalidateStarterPacks';
import { useStarterPacks } from './useStarterPacks';

const useStarterPacksWithRefreshOnMount = ({ fid }: { fid: number }) => {
  const initialValue = useStarterPacks({ fid });

  const queryKey = useMemo(() => buildStarterPacksKey({ fid }), [fid]);

  const invalidateStarterPacks = useInvalidateStarterPacks();

  const invalidate = useCallback(() => {
    invalidateStarterPacks({ fid });
  }, [fid, invalidateStarterPacks]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useStarterPacksWithRefreshOnMount };
