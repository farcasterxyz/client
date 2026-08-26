import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';

import { UpdateCastLikeError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateCast } from '../optimistic/useOptimisticallyUpdateCast';

const useDeleteCastLike = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateCast = useOptimisticallyUpdateCast();

  return useCallback(
    async ({ cast }: { cast: ApiCast }) => {
      const revertOptimisticUpdates = optimisticallyUpdateCast({
        updates: {
          hash: cast.hash,
          reactions: {
            count: Math.max(0, cast.reactions.count - 1),
          },
          viewerContext: {
            reacted: false,
          },
        },
        revertUpdates: {
          hash: cast.hash,
          reactions: {
            count: cast.reactions.count,
          },
          viewerContext: {
            reacted: cast.viewerContext?.reacted,
          },
        },
      });

      try {
        const response = await apiClient.deleteCastLike({
          castHash: cast.hash,
        });
        return response.data;
      } catch (error) {
        revertOptimisticUpdates();
        throw new UpdateCastLikeError({ castHash: cast.hash, error });
      }
    },
    [apiClient, optimisticallyUpdateCast],
  );
};

export { useDeleteCastLike };
