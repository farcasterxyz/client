import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export function useRecordCastFeedback() {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ castHash }: { castHash: string }) => {
      await apiClient.recordCastFeedback({ castHash });
    },
    [apiClient],
  );
}
