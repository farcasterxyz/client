import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useResetOnboardingState = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ email }: { email: string }) => {
      const response = await apiClient.resetOnboardingState({ email });

      return response.data;
    },
    [apiClient],
  );
};

export { useResetOnboardingState };
