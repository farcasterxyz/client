import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useMarkNotificationTabSeen = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({ tab }: { tab: string }) => {
      return apiClient.markAllTabNotificationsSeen({ tab });
    },
    [apiClient],
  );
};
