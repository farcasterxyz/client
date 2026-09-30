import { useCallback } from 'react';

import { UpdateUserVisibilityError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import {
  useOptimisticallyUpdateCast,
  useOptimisticallyUpdateUser,
} from '../optimistic';

const useMarkInvisibleFromCast = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();
  const optimistallyUpdateCast = useOptimisticallyUpdateCast();

  return useCallback(
    async ({
      targetFid,
      castHash,
      block,
    }: {
      targetFid: number;
      castHash: string;
      block: boolean;
    }) => {
      const revertMarkInvisibleUpdateUser = optimisticallyUpdateUser({
        updates: {
          fid: targetFid,
          viewerContext: { invisible: true, blocking: block },
        },
        revertUpdates: {
          fid: targetFid,
          viewerContext: { invisible: false, blocking: false },
        },
      });

      const revertMarkInvisibleUpdateCast = optimistallyUpdateCast({
        updates: {
          hash: castHash,
          author: {
            viewerContext: { invisible: true, blocking: block },
          },
        },
        revertUpdates: {
          hash: castHash,
          author: {
            viewerContext: { invisible: false, blocking: false },
          },
        },
      });

      try {
        const response = await apiClient.limitVisibility({
          targetFid,
          block,
        });

        return response.data;
      } catch (error) {
        revertMarkInvisibleUpdateUser();
        revertMarkInvisibleUpdateCast();

        throw new UpdateUserVisibilityError({ error });
      }
    },
    [apiClient, optimistallyUpdateCast, optimisticallyUpdateUser],
  );
};

export { useMarkInvisibleFromCast };
