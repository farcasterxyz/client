import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildFeaturedHeroAppsKey } from './buildFeaturedHeroAppsKey';

const useInvalidateFeaturedHeroApps = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildFeaturedHeroAppsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateFeaturedHeroApps };
