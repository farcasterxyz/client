import { ApiNuxTaskName } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateNextNuxTask } from '../queries/nextNuxTask/useInvalidateNextNuxTask';

const useCompleteNuxTask = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateNextNuxTask = useInvalidateNextNuxTask();

  return useCallback(
    async ({ task }: { task: ApiNuxTaskName }) => {
      const response = await apiClient.completeNuxTask({
        task,
      });

      await invalidateNextNuxTask();

      return response.data.result;
    },
    [apiClient, invalidateNextNuxTask],
  );
};

export { useCompleteNuxTask };
