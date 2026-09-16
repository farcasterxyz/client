import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSetLastCheckedTimestamp = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    return apiClient.setLastCheckedTimestamp();
  }, [apiClient]);
};

export { useSetLastCheckedTimestamp };
