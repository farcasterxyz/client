import { ApiOnboardingInterestCategorySelections } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSetOnboardingInterestCategory = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      selections,
    }: {
      selections: ApiOnboardingInterestCategorySelections[];
    }) => {
      const response = await apiClient.setOnboardingInterestCategories({
        selections,
      });

      return response.data;
    },
    [apiClient],
  );
};

export { useSetOnboardingInterestCategory };
