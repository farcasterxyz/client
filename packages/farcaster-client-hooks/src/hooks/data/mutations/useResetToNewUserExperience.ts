import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useResetToNewUserExperience = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    await apiClient.resetToNewUserExperience();
  }, [apiClient]);
};
