import { ApiLinkNotificationsFilter } from 'farcaster-client-data';
import { useCallback } from 'react';

import { UpdateLinkNotificationsError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateUser } from '../optimistic';

const useEnableLinkNotifications = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();

  return useCallback(
    async ({
      targetFid,
      filter,
    }: {
      targetFid: number;
      filter: ApiLinkNotificationsFilter;
    }) => {
      const revertEnableLinkNotificationsUpdate = optimisticallyUpdateUser({
        updates: {
          fid: targetFid,
          viewerContext: {
            enableNotifications: true,
            castNotificationsType: filter,
          },
        },
        revertUpdates: {
          fid: targetFid,
          viewerContext: {
            enableNotifications: false,
            castNotificationsType: undefined,
          },
        },
      });

      try {
        const response = await apiClient.enableLinkNotifications({
          targetFid,
          filter,
        });

        if (!response.data.result.success) {
          revertEnableLinkNotificationsUpdate();
        }

        return response.data;
      } catch (error) {
        revertEnableLinkNotificationsUpdate();

        throw new UpdateLinkNotificationsError({ error });
      }
    },
    [apiClient, optimisticallyUpdateUser],
  );
};

export { useEnableLinkNotifications };
