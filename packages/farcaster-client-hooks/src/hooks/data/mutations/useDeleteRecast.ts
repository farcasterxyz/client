import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateCast } from '../optimistic';
import { useInvalidateUserCasts } from '../queries/userCasts/useInvalidateUserCasts';

const useUndoRecast = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateUserCasts = useInvalidateUserCasts();

  const optimisticallyUpdateCast = useOptimisticallyUpdateCast();

  return useCallback(
    async ({ cast, viewerFid }: { cast: ApiCast; viewerFid: number }) => {
      const revertOptimisticUpdates = optimisticallyUpdateCast({
        updates: {
          hash: cast.hash,
          recasts: {
            count: Math.max(0, cast.recasts.count - 1),
            recasters: cast.recasts.recasters?.filter(
              (recaster) => recaster.fid !== viewerFid,
            ),
          },
          viewerContext: {
            recast: false,
          },
          combinedRecastCount:
            typeof cast.combinedRecastCount !== 'undefined'
              ? Math.max(0, cast.combinedRecastCount - 1)
              : undefined,
        },
        revertUpdates: {
          hash: cast.hash,
          recasts: {
            count: cast.recasts.count,
            recasters: cast.recasts.recasters?.slice(),
          },
          viewerContext: {
            recast: cast.viewerContext?.recast,
          },
          combinedRecastCount:
            typeof cast.combinedRecastCount !== 'undefined'
              ? cast.combinedRecastCount
              : undefined,
        },
      });

      try {
        await apiClient.deleteRecast({
          castHash: cast.hash,
        });

        invalidateUserCasts({ fid: viewerFid });
      } catch (error) {
        revertOptimisticUpdates();
        throw error;
      }
    },
    [apiClient, invalidateUserCasts, optimisticallyUpdateCast],
  );
};

export { useUndoRecast };
