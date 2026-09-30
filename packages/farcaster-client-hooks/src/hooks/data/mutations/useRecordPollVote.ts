import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useRecordPollVote = () => {
  const { apiClient } = useFarcasterApiClient();
  return useCallback(
    async (...args: Parameters<typeof apiClient.recordPollVote>) => {
      const { data } = await apiClient.recordPollVote(...args);
      return data.result;
    },
    [apiClient],
  );
};
