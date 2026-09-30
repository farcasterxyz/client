import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserMinimal } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { frameAnalyticsProperties } from '../../generic/useFrameAnalyticsProperties';
import { useInvalidateFavoriteFrames } from '../queries/favoriteFrames/useInvalidateFavoriteFrames';
import { useOptimisticallyUpdateFrame } from '../queries/frameDetails/framesGlobalCache';
import { useInvalidateFrameDetails } from '../queries/frameDetails/useInvalidateFrameDetails';
import { useInvalidateTopMiniApps } from '../queries/topMiniApps/useInvalidateTopMiniApps';
import { buildUserAppContextKey } from '../queries/userAppContext';

export function useAddFavoriteFrame() {
  const { apiClient } = useFarcasterApiClient();
  const { trackEvent } = useTrackEvent();

  const queryClient = useQueryClient();
  const invalidateFavoriteFrames = useInvalidateFavoriteFrames();
  const invalidateTopMiniApps = useInvalidateTopMiniApps();
  const invalidateFrameDetails = useInvalidateFrameDetails();
  const optimisticallyUpdateFrame = useOptimisticallyUpdateFrame();

  return useCallback(
    async ({
      domain,
      url,
      name,
      author,
    }: {
      domain: string;
      url: string;
      name: string;
      author?: ApiUserMinimal;
    }) => {
      const revertOptimisticUpdate = optimisticallyUpdateFrame({
        domain,
        viewerContext: {
          favorited: true,
        },
      });

      try {
        const result = await apiClient.addFavoriteFrame({ domain });

        if (result.data.result.notificationDetails) {
          optimisticallyUpdateFrame({
            domain,
            viewerContext: {
              notificationsEnabled: true,
              notificationDetails: result.data.result.notificationDetails,
            },
          });
        }

        trackEvent(
          AnalyticsEvent.AddFavoriteFrame,
          frameAnalyticsProperties({
            frameUrl: url,
            frameName: name,
            author,
          }),
        );

        setTimeout(() => {
          invalidateFavoriteFrames();
          invalidateTopMiniApps();
          invalidateFrameDetails({ domain });

          // Refetch user app context to update share extensions
          queryClient.invalidateQueries({
            queryKey: buildUserAppContextKey(),
          });
        }, 1500);

        return result.data.result;
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
      optimisticallyUpdateFrame,
      invalidateFavoriteFrames,
      invalidateTopMiniApps,
      invalidateFrameDetails,
      trackEvent,
      queryClient,
    ],
  );
}
