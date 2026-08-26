import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateNextNuxTask } from '../queries/nextNuxTask/useInvalidateNextNuxTask';

const useResetNuxTasks = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateNextNuxTask = useInvalidateNextNuxTask();

  return useCallback(
    async ({ fid }: { fid: number }) => {
      const response = await apiClient.resetNuxTasks({
        fid,
      });

      await invalidateNextNuxTask();

      return response.data.result;
    },
    [apiClient, invalidateNextNuxTask],
  );
};

export { useResetNuxTasks };
