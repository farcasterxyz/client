import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

function useRecordExploreFeedSeen() {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    await apiClient.recordExploreFeedSeen();
  }, [apiClient]);
}

export { useRecordExploreFeedSeen };
