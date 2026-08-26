import { useCallback } from 'react';

import { UpdateUserVisibilityError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import {
  useOptimisticallyUpdateCast,
  useOptimisticallyUpdateUser,
} from '../optimistic';

const useMarkVisibleFromCast = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();
  const optimistallyUpdateCast = useOptimisticallyUpdateCast();

  return useCallback(
    async ({
      targetFid,
      castHash,
    }: {
      targetFid: number;
      castHash: string;
    }) => {
      const revertMarkVisibleUpdateUser = optimisticallyUpdateUser({
        updates: {
          fid: targetFid,
          viewerContext: { invisible: false },
        },
        revertUpdates: {
          fid: targetFid,
          viewerContext: { invisible: true },
        },
      });

      const revertMarkVisibleUpdateCast = optimistallyUpdateCast({
        updates: {
          hash: castHash,
          author: {
            viewerContext: { invisible: false },
          },
        },
        revertUpdates: {
          hash: castHash,
          author: {
            viewerContext: { invisible: true },
          },
        },
      });

      try {
        const response = await apiClient.removeVisibilityRestrictions({
          targetFid,
        });

        return response.data;
      } catch (error) {
        revertMarkVisibleUpdateUser();
        revertMarkVisibleUpdateCast();

        throw new UpdateUserVisibilityError({ error });
      }
    },
    [apiClient, optimistallyUpdateCast, optimisticallyUpdateUser],
  );
};

export { useMarkVisibleFromCast };
