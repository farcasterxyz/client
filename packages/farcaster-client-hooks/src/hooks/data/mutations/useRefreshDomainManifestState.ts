import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateFavoriteFrames } from '../queries/favoriteFrames/useInvalidateFavoriteFrames';
import { useInvalidateFrameDetails } from '../queries/frameDetails/useInvalidateFrameDetails';
import { useInvalidateTopMiniApps } from '../queries/topMiniApps/useInvalidateTopMiniApps';

export function useRefreshDomainManifestState() {
  const { apiClient } = useFarcasterApiClient();
  const invalidateFavoriteFrames = useInvalidateFavoriteFrames();
  const invalidateTopMiniApps = useInvalidateTopMiniApps();
  const invalidateFrameDetails = useInvalidateFrameDetails();

  return useCallback(
    async ({ domain }: { domain: string }) => {
      const response = await apiClient.refreshDomainManifestState({ domain });

      invalidateFavoriteFrames();
      invalidateTopMiniApps();
      invalidateFrameDetails({ domain });

      return response.data.result.state;
    },
    [
      apiClient,
      invalidateFavoriteFrames,
      invalidateTopMiniApps,
      invalidateFrameDetails,
    ],
  );
}
