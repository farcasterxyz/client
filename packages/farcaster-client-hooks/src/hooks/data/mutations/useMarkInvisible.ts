import { useCallback } from 'react';

import { UpdateUserVisibilityError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateUser } from '../optimistic';
import { useInvalidateBlockedUsers } from '../queries/blockedUsers';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';
import { useRemoveConversationWithUser } from '../queries/directCastInbox/useRemoveConversationWithUser';
import { useRemoveUserFromAllFeeds } from '../queries/feedItems/useRemoveUserFromAllFeeds';
import { useInvalidateMutedUsers } from '../queries/mutedUsers';

const useMarkInvisible = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();
  const removeUserFromAllFeeds = useRemoveUserFromAllFeeds();
  const removeConversationWithUser = useRemoveConversationWithUser();
  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();
  const invalidateBlockedUsers = useInvalidateBlockedUsers();
  const invalidateMutedUsers = useInvalidateMutedUsers();

  return useCallback(
    async ({
      targetFid,
      block,
      viewerFid,
    }: {
      viewerFid?: number;
      block: boolean;
      targetFid: number;
    }) => {
      const revertMarkInvisibleUpdate = optimisticallyUpdateUser({
        updates: {
          fid: targetFid,
          viewerContext: { invisible: true, blocking: block },
        },
        revertUpdates: {
          fid: targetFid,
          viewerContext: { invisible: false, blocking: false },
        },
      });

      try {
        const response = await apiClient.limitVisibility({ targetFid, block });

        removeUserFromAllFeeds({ fid: targetFid });

        if (viewerFid && block) {
          removeConversationWithUser({ viewerFid, targetFid });
          invalidateDirectCastInboxByAccount({
            fid: viewerFid,
            category: 'default',
          });
          invalidateDirectCastInboxByAccount({
            fid: viewerFid,
            category: 'request',
          });
          invalidateDirectCastInboxByAccount({
            fid: viewerFid,
            category: 'archived',
          });
        }

        if (block) {
          invalidateBlockedUsers();
        } else {
          invalidateMutedUsers();
        }

        return response.data;
      } catch (error) {
        revertMarkInvisibleUpdate();

        throw new UpdateUserVisibilityError({ error });
      }
    },
    [
      apiClient,
      optimisticallyUpdateUser,
      removeUserFromAllFeeds,
      removeConversationWithUser,
      invalidateDirectCastInboxByAccount,
      invalidateBlockedUsers,
      invalidateMutedUsers,
    ],
  );
};

export { useMarkInvisible };
