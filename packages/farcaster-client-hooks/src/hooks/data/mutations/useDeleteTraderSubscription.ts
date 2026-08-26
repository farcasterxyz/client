import { useCallback } from 'react';

import { UpdateLinkNotificationsError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateUser } from '../optimistic';

const useDeleteTraderSubscription = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();

  return useCallback(
    async ({
      targetFid,
      previousMinimumValueUsd,
    }: {
      targetFid: number;
      previousMinimumValueUsd: number;
    }) => {
      const revertDeleteTraderSubscriptionUpdate = optimisticallyUpdateUser({
        updates: {
          fid: targetFid,
          viewerContext: { traderNotificationThreshold: -1 },
        },
        revertUpdates: {
          fid: targetFid,
          viewerContext: {
            traderNotificationThreshold: previousMinimumValueUsd,
          },
        },
      });

      try {
        const response = await apiClient.deleteTraderSubscription({
          targetFid,
        });

        if (!response.data.result.success) {
          revertDeleteTraderSubscriptionUpdate();
        }

        return response.data;
      } catch (error) {
        revertDeleteTraderSubscriptionUpdate();

        throw new UpdateLinkNotificationsError({ error });
      }
    },
    [apiClient, optimisticallyUpdateUser],
  );
};

export { useDeleteTraderSubscription };
