import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserMinimal } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { frameKeyExtractor } from '../../../utils';
import { frameAnalyticsProperties } from '../../generic/useFrameAnalyticsProperties';
import { removeItemFromPaginatedResultCaches } from '../helpers';
import {
  buildFavoriteFramesKey,
  useInvalidateFavoriteFrames,
} from '../queries/favoriteFrames';
import { useOptimisticallyUpdateFrame } from '../queries/frameDetails/framesGlobalCache';
import { useInvalidateFrameDetails } from '../queries/frameDetails/useInvalidateFrameDetails';
import { useInvalidateTopMiniApps } from '../queries/topMiniApps/useInvalidateTopMiniApps';
import { buildUserAppContextKey } from '../queries/userAppContext';

export function useRemoveFavoriteFrame() {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const { trackEvent } = useTrackEvent();

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
          favorited: false,
          notificationsEnabled: false,
          notificationDetails: undefined,
        },
      });

      removeItemFromPaginatedResultCaches({
        queryClient,
        queryKey: buildFavoriteFramesKey(),
        keyExtractor: frameKeyExtractor,
        removeKey: domain,
      });

      try {
        const result = await apiClient.removeFavoriteFrame({ domain });
        // Refetch user app context to update share extensions
        queryClient.invalidateQueries({
          queryKey: buildUserAppContextKey(),
        });

        trackEvent(
          AnalyticsEvent.RemoveFavoriteFrame,
          frameAnalyticsProperties({
            frameUrl: url,
            frameName: name,
            author,
          }),
        );

        return result.data.result;
      } catch (e: unknown) {
        revertOptimisticUpdate();
        invalidateTopMiniApps();
        invalidateFavoriteFrames();
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
      queryClient,
      trackEvent,
    ],
  );
}
