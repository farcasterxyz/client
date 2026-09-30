import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useDismissNewUserFollowsBanner = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    await apiClient.dismissNewUserFollowsBanner();
  }, [apiClient]);
};
