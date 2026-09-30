import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildLookupOnboardingStateKey } from './buildLookupOnboardingStateKey';

const useInvalidateLookupOnboardingState = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ email }: { email: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildLookupOnboardingStateKey({ email }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateLookupOnboardingState };
