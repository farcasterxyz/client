import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { UpdateChannelNotificationsError } from '../../../errors';
import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateChannel } from '../optimistic/useOptimisticallyUpdateChannel';
import { useInvalidateChannel } from '../queries/channel/useInvalidateChannel';

const useDisableChannelNotifications = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateChannel = useOptimisticallyUpdateChannel();
  const invalidateChannel = useInvalidateChannel();
  const { trackEvent } = useTrackEvent();

  return useCallback(
    async ({ channelKey }: { channelKey: string }) => {
      const revertDisableChannelNotificationsUpdate =
        optimisticallyUpdateChannel({
          updates: {
            key: channelKey,
            viewerContext: { enableNotifications: false },
          },
          revertUpdates: {
            key: channelKey,
            viewerContext: { enableNotifications: true },
          },
        });

      try {
        trackEvent(AnalyticsEvent.ToggleChannelNotifications, {
          toggle: 'off',
          channelKey,
        });

        const response = await apiClient.disableChannelNotifications({
          channelKey,
        });

        if (!response.data.result.success) {
          revertDisableChannelNotificationsUpdate();
        }

        invalidateChannel({ key: channelKey });

        return response.data;
      } catch (error) {
        revertDisableChannelNotificationsUpdate();

        throw new UpdateChannelNotificationsError({ error });
      }
    },
    [apiClient, invalidateChannel, optimisticallyUpdateChannel, trackEvent],
  );
};

export { useDisableChannelNotifications };
