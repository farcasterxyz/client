import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateCampaign } from '../queries/campaign/useInvalidateCampaign';

export const useCompleteCampaign = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateCampaign = useInvalidateCampaign();

  return useCallback(
    async ({ campaignId }: { campaignId: string }) => {
      const { data } = await apiClient.completeCampaign({
        campaignId,
      });

      await invalidateCampaign({ id: campaignId });

      return data.result;
    },
    [apiClient, invalidateCampaign],
  );
};
