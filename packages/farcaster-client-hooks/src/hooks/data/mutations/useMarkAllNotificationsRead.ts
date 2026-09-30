import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useMarkAllNotificationsRead = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    return apiClient.markAllNotificationsRead();
  }, [apiClient]);
};

export { useMarkAllNotificationsRead };
