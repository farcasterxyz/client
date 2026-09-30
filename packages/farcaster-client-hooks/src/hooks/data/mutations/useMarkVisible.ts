import { useCallback } from 'react';

import { UpdateUserVisibilityError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateUser } from '../optimistic';
import { useInvalidateBlockedUsers } from '../queries/blockedUsers';
import { useInvalidateMutedUsers } from '../queries/mutedUsers';

const useMarkVisible = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();
  const invalidateBlockedUsers = useInvalidateBlockedUsers();
  const invalidateMutedUsers = useInvalidateMutedUsers();

  return useCallback(
    async ({ targetFid }: { targetFid: number }) => {
      const revertMarkVisibleUpdate = optimisticallyUpdateUser({
        updates: {
          fid: targetFid,
          viewerContext: { invisible: false },
        },
        revertUpdates: {
          fid: targetFid,
          viewerContext: { invisible: true },
        },
      });

      try {
        const response = await apiClient.removeVisibilityRestrictions({
          targetFid,
        });

        invalidateBlockedUsers();
        invalidateMutedUsers();

        return response.data;
      } catch (error) {
        revertMarkVisibleUpdate();

        throw new UpdateUserVisibilityError({ error });
      }
    },
    [
      apiClient,
      invalidateBlockedUsers,
      invalidateMutedUsers,
      optimisticallyUpdateUser,
    ],
  );
};

export { useMarkVisible };
