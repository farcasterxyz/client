import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildOnboardingStateKey } from './buildOnboardingStateKey';

const usePurgeOnboardingState = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.removeQueries({
      queryKey: buildOnboardingStateKey(),
    });
  }, [queryClient]);
};

export { usePurgeOnboardingState };
