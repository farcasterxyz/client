import { ApiSelectedInterest } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSubmitOnboardingSelectedInterests = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      interests,
      promptingExistingUsers,
    }: {
      interests: ApiSelectedInterest[];
      promptingExistingUsers: boolean;
    }) => {
      const response = await apiClient.submitSelectedOnboardingInterests({
        interests,
        promptingExistingUsers,
      });

      return response.data;
    },
    [apiClient],
  );
};

export { useSubmitOnboardingSelectedInterests };
