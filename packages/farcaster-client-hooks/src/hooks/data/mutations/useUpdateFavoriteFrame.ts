import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { frameAnalyticsProperties } from '../../generic/useFrameAnalyticsProperties';
import { useInvalidateFavoriteFrames } from '../queries/favoriteFrames/useInvalidateFavoriteFrames';
import { useOptimisticallyUpdateFrame } from '../queries/frameDetails/framesGlobalCache';
import { useInvalidateFrameDetails } from '../queries/frameDetails/useInvalidateFrameDetails';
import { useInvalidateTopMiniApps } from '../queries/topMiniApps/useInvalidateTopMiniApps';
import {
  buildUpdateFavoriteFrameRequest,
  type UpdateFavoriteFrameParams,
} from './useUpdateFavoriteFrame.internal';

export function useUpdateFavoriteFrame() {
  const { apiClient } = useFarcasterApiClient();
  const { trackEvent } = useTrackEvent();

  const optimisticallyUpdateFrame = useOptimisticallyUpdateFrame();
  const invalidateFavoriteFrames = useInvalidateFavoriteFrames();
  const invalidateTopMiniApps = useInvalidateTopMiniApps();
  const invalidateFrameDetails = useInvalidateFrameDetails();

  return useCallback(
    async ({
      frame,
      disableNotifications,
      pushNotificationsEnabled,
      position,
    }: UpdateFavoriteFrameParams) => {
      let revertOptimisticUpdate;
      if (disableNotifications) {
        revertOptimisticUpdate = optimisticallyUpdateFrame({
          domain: frame.domain,
          viewerContext: {
            notificationsEnabled: false,
            notificationDetails: undefined,
            ...(pushNotificationsEnabled !== undefined && {
              pushNotificationsEnabled,
            }),
          },
        });
      }

      try {
        await apiClient.updateFavoriteFrame(
          buildUpdateFavoriteFrameRequest({
            frame,
            disableNotifications,
            pushNotificationsEnabled,
            position,
          }),
        );

        trackEvent(
          AnalyticsEvent.EnableFrameNotifications,
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
      } catch (e: unknown) {
        if (revertOptimisticUpdate) {
          revertOptimisticUpdate();
        }
        invalidateFavoriteFrames();
        invalidateTopMiniApps();
        invalidateFrameDetails({ domain: frame.domain });
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
