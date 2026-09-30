import { ApiCreateTraderSubscriptionRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { UpdateTraderSubscriptionError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateUser } from '../optimistic';

const useCreateTraderSubscription = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();

  return useCallback(
    async (params: ApiCreateTraderSubscriptionRequestBody) => {
      const targetFids =
        params.targetFids ?? (params.targetFid ? [params.targetFid] : []);
      const reverts = targetFids.map((fid) => ({
        fid,
        revert: optimisticallyUpdateUser({
          updates: {
            fid,
            viewerContext: {
              traderNotificationThreshold: params.minimumValueUsd ?? 0,
              traderNotificationsType: params.type,
            },
          },
          revertUpdates: {
            fid,
            viewerContext: {
              traderNotificationThreshold: undefined,
              traderNotificationsType: undefined,
            },
          },
        }),
      }));

      try {
        const response = await apiClient.createTraderSubscription(params);

        if (!response.data.result.success) {
          for (const revert of reverts) {
            revert.revert();
          }
        }

        return response.data;
      } catch (error) {
        for (const revert of reverts) {
          revert.revert();
        }

        throw new UpdateTraderSubscriptionError({ error });
      }
    },
    [apiClient, optimisticallyUpdateUser],
  );
};

export { useCreateTraderSubscription };
