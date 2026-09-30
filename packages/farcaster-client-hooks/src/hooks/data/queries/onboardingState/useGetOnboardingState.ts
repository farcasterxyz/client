import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { OnboardingStateCache } from '../../../../types';
import { buildOnboardingStateKey } from './buildOnboardingStateKey';

// Useful for getting the current onboarding state outside React render cycles.
export const useGetOnboardingState = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    return queryClient.getQueryData<OnboardingStateCache>(
      buildOnboardingStateKey(),
    );
  }, [queryClient]);
};
