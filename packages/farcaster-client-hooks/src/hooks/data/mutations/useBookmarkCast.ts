import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateCast } from '../optimistic/useOptimisticallyUpdateCast';
import { useInvalidateBookmarkedCasts } from '../queries/bookmarkedCasts/useInvalidateBookmarkedCasts';

const useBookmarkCast = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateCast = useOptimisticallyUpdateCast();

  const invalidateBookmarkedCasts = useInvalidateBookmarkedCasts();

  return useCallback(
    async ({ cast }: { cast: ApiCast }) => {
      const revertOptimisticUpdates = optimisticallyUpdateCast({
        updates: {
          hash: cast.hash,
          bookmarkCount: (cast.bookmarkCount || 0) + 1,
          viewerContext: {
            bookmarked: true,
          },
        },
        revertUpdates: {
          hash: cast.hash,
          bookmarkCount: cast.bookmarkCount,
          viewerContext: {
            bookmarked: false,
          },
        },
      });

      try {
        await apiClient.bookmarkCast({
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

export { useBookmarkCast };
