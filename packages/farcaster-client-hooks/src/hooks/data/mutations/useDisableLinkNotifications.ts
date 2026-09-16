import { useCallback } from 'react';

import { UpdateLinkNotificationsError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateUser } from '../optimistic';

const useDisableLinkNotifications = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();

  return useCallback(
    async ({ targetFid }: { targetFid: number }) => {
      const revertDisableLinkNotificationsUpdate = optimisticallyUpdateUser({
        updates: {
          fid: targetFid,
          viewerContext: { enableNotifications: false },
        },
        revertUpdates: {
          fid: targetFid,
          viewerContext: { enableNotifications: true },
        },
      });

      try {
        const response = await apiClient.disableLinkNotifications({
          targetFid,
        });

        if (!response.data.result.success) {
          revertDisableLinkNotificationsUpdate();
        }

        return response.data;
      } catch (error) {
        revertDisableLinkNotificationsUpdate();

        throw new UpdateLinkNotificationsError({ error });
      }
    },
    [apiClient, optimisticallyUpdateUser],
  );
};

export { useDisableLinkNotifications };
