import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateCast } from '../optimistic/useOptimisticallyUpdateCast';

const useUnwatchCastCollectible = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateCast = useOptimisticallyUpdateCast();

  return useCallback(
    async ({ cast }: { cast: ApiCast }) => {
      const collectibleUpdate =
        cast.collectible && cast.collectible.state === 'unavailable'
          ? {
              ...cast.collectible,
              viewerContext: {
                isWatching: false,
              },
            }
          : cast.collectible;

      const collectibleRevert =
        cast.collectible && cast.collectible.state === 'unavailable'
          ? {
              ...cast.collectible,
              viewerContext: {
                isWatching: cast.collectible.viewerContext?.isWatching || true,
              },
            }
          : cast.collectible;

      const revertOptimisticUpdates = optimisticallyUpdateCast({
        updates: {
          hash: cast.hash,
          recast: cast.recast,
          collectible: collectibleUpdate,
        },
        revertUpdates: {
          hash: cast.hash,
          recast: cast.recast,
          collectible: collectibleRevert,
        },
      });

      try {
        await apiClient.unwatchCastCollectible({
          castHash: cast.hash,
        });
      } catch (error) {
        revertOptimisticUpdates();
        throw error;
      }
    },
    [apiClient, optimisticallyUpdateCast],
  );
};

export { useUnwatchCastCollectible };
