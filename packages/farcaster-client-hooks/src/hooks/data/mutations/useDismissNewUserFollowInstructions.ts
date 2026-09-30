import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useDismissNewUserFollowInstructions = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    await apiClient.dismissNewUserFollowInstructions();
  }, [apiClient]);
};
