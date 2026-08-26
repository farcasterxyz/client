import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildOnboardingStateKey } from './buildOnboardingStateKey';

const useInvalidateOnboardingState = () => {
  const queryClient = useQueryClient();

  return useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: buildOnboardingStateKey(),
      }),
    [queryClient],
  );
};

export { useInvalidateOnboardingState };
