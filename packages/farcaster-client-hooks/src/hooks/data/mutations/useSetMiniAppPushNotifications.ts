import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { frameAnalyticsProperties } from '../../generic/useFrameAnalyticsProperties';
import { useInvalidateFavoriteFrames } from '../queries/favoriteFrames/useInvalidateFavoriteFrames';
import { useOptimisticallyUpdateFrame } from '../queries/frameDetails/framesGlobalCache';
import { useInvalidateFrameDetails } from '../queries/frameDetails/useInvalidateFrameDetails';
import { useInvalidateTopMiniApps } from '../queries/topMiniApps/useInvalidateTopMiniApps';

export function useSetMiniAppPushNotifications() {
  const { apiClient } = useFarcasterApiClient();
  const { trackEvent } = useTrackEvent();
  const optimisticallyUpdateFrame = useOptimisticallyUpdateFrame();
  const invalidateFavoriteFrames = useInvalidateFavoriteFrames();
  const invalidateTopMiniApps = useInvalidateTopMiniApps();
  const invalidateFrameDetails = useInvalidateFrameDetails();

  return useCallback(
    async ({ frame, enabled }: { frame: ApiFrame; enabled: boolean }) => {
      const revertOptimisticUpdate = optimisticallyUpdateFrame({
        domain: frame.domain,
        viewerContext: { pushNotificationsEnabled: enabled },
      });

      try {
        await apiClient.updateFavoriteFrame({
          domain: frame.domain,
          pushNotificationsEnabled: enabled,
        });
        trackEvent(
          enabled
            ? AnalyticsEvent.EnableMiniAppPushNotifications
            : AnalyticsEvent.DisableMiniAppPushNotifications,
          frameAnalyticsProperties({
            frameName: frame.name,
            frameUrl: frame.homeUrl,
            author: frame.author,
          }),
        );
        setTimeout(() => {
          invalidateFavoriteFrames();
          invalidateTopMiniApps();
          invalidateFrameDetails({ domain: frame.domain });
        }, 3000);
      } catch (error) {
        revertOptimisticUpdate();
        invalidateFavoriteFrames();
        invalidateTopMiniApps();
        invalidateFrameDetails({ domain: frame.domain });
        throw error;
      }
    },
    [
      apiClient,
      invalidateFavoriteFrames,
      invalidateFrameDetails,
      invalidateTopMiniApps,
      optimisticallyUpdateFrame,
      trackEvent,
    ],
  );
}
