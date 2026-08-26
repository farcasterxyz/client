import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateCast } from '../optimistic';
import { useInvalidateBookmarkedCasts } from '../queries/bookmarkedCasts/useInvalidateBookmarkedCasts';

const useRemoveCastBookmark = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateCast = useOptimisticallyUpdateCast();

  const invalidateBookmarkedCasts = useInvalidateBookmarkedCasts();

  return useCallback(
    async ({ cast }: { cast: ApiCast }) => {
      const revertOptimisticUpdates = optimisticallyUpdateCast({
        updates: {
          hash: cast.hash,
          bookmarkCount: Math.max(0, (cast.bookmarkCount || 0) - 1),
          viewerContext: {
            bookmarked: false,
          },
        },
        revertUpdates: {
          hash: cast.hash,
          bookmarkCount: cast.bookmarkCount,
          viewerContext: {
            bookmarked: true,
          },
        },
      });

      try {
        await apiClient.removeCastBookmark({
          castHash: cast.hash,
        });

        invalidateBookmarkedCasts();
      } catch (error) {
        revertOptimisticUpdates();
        throw error;
      }
    },
    [apiClient, invalidateBookmarkedCasts, optimisticallyUpdateCast],
  );
};

export { useRemoveCastBookmark };
