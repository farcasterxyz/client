import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildSuggestedStarterPacksKey } from './buildSuggestedStarterPacksKey';
import { useInvalidateSuggestedStarterPacks } from './useInvalidateSuggestedStarterPacks';
import { useSuggestedStarterPacks } from './useSuggestedStarterPacks';

const useSuggestedStarterPacksWithRefreshOnMount = () => {
  const initialValue = useSuggestedStarterPacks();

  const queryKey = useMemo(() => buildSuggestedStarterPacksKey(), []);

  const invalidateSuggestedStarterPacks = useInvalidateSuggestedStarterPacks();

  const invalidate = useCallback(() => {
    invalidateSuggestedStarterPacks();
  }, [invalidateSuggestedStarterPacks]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useSuggestedStarterPacksWithRefreshOnMount };
