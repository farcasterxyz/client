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

export function useEnableFrameNotifications() {
  const { apiClient } = useFarcasterApiClient();
  const { trackEvent } = useTrackEvent();

  const optimisticallyUpdateFrame = useOptimisticallyUpdateFrame();
  const invalidateFavoriteFrames = useInvalidateFavoriteFrames();
  const invalidateTopMiniApps = useInvalidateTopMiniApps();
  const invalidateFrameDetails = useInvalidateFrameDetails();

  return useCallback(
    async ({ domain, name, homeUrl, author }: ApiFrame) => {
      const revertOptimisticUpdate = optimisticallyUpdateFrame({
        domain,
        viewerContext: {
          notificationsEnabled: true,
        },
      });

      try {
        const result = await apiClient.enableFrameNotifications({ domain });

        trackEvent(
          AnalyticsEvent.EnableFrameNotifications,
          frameAnalyticsProperties({
            frameName: name,
            frameUrl: homeUrl,
            author,
          }),
        );

        // setTimeout(() => {
        //   invalidateFavoriteFrames();
        //   invalidateTopMiniApps();
        //   invalidateFrameDetails({ domain });
        // }, 3000);

        return result.data.result.notificationDetails;
      } catch (e: unknown) {
        revertOptimisticUpdate();
        invalidateFavoriteFrames();
        invalidateTopMiniApps();
        invalidateFrameDetails({ domain });
        throw e;
      }
    },
    [
      apiClient,
      invalidateFavoriteFrames,
      invalidateTopMiniApps,
      invalidateFrameDetails,
      optimisticallyUpdateFrame,
      trackEvent,
    ],
  );
}
