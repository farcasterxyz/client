import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useUpdateUserForOnboarding = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (
      params: Partial<{
        bio: string;
        displayName: string;
        pfp: string;
        location: {
          placeId: string;
          description: string;
        };
      }>,
    ) => {
      const result = await apiClient.updateUser(params);

      return result;
    },
    [apiClient],
  );
};

export { useUpdateUserForOnboarding };
