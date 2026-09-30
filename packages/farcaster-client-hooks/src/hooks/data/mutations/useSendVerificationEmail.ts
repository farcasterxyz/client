import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';
import { useInvalidateOnboardingState } from '../queries/onboardingState/useInvalidateOnboardingState';
import { useStepUpAuth } from './useStepUpAuth';

const useSendVerificationEmail = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateOnboardingState = useInvalidateOnboardingState();
  const { stepUpAuthOrThrow } = useStepUpAuth();

  return useCallback(
    async ({
      account,
      email,
      invalidateOnboardingStateAfterUpdate,
    }: {
      email: string;
      invalidateOnboardingStateAfterUpdate: boolean;
      account: LocalAccountWithSign;
    }) => {
      // Temporarily step up privileges
      await stepUpAuthOrThrow({
        account,
      });

      // Keep existing auth code
      await apiClient.sendVerificationEmail({ email });
      if (invalidateOnboardingStateAfterUpdate) {
        invalidateOnboardingState();
      }
    },
    [apiClient, invalidateOnboardingState, stepUpAuthOrThrow],
  );
};

export { useSendVerificationEmail };
