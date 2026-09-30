import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSetTurnstileState = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      onboardingId,
      token,
      errorCode,
    }: {
      onboardingId: string;
      token?: string;
      errorCode?: string;
    }) => {
      await apiClient.setTurnstileChallengeState({
        onboardingId,
        token,
        errorCode,
      });
    },
    [apiClient],
  );
};

export { useSetTurnstileState };
