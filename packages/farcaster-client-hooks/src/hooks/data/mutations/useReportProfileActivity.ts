import { useMutation } from '@tanstack/react-query';
import { ApiReportProfileActivityType } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useReportProfileActivity = () => {
  const { apiClient } = useFarcasterApiClient();

  return useMutation({
    mutationFn: async ({
      activityType,
    }: {
      activityType: ApiReportProfileActivityType;
    }) => {
      const result = await apiClient.reportProfileActivity({ activityType });
      if (result.data.result.success !== true) {
        throw new Error(`Failed to report profile activity: ${activityType}`);
      }
      return true;
    },
  });
};
