import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildSuggestedStarterPacksKey } from './buildSuggestedStarterPacksKey';

const useInvalidateSuggestedStarterPacks = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildSuggestedStarterPacksKey(),
    });
  }, [queryClient]);
};

export { useInvalidateSuggestedStarterPacks };
