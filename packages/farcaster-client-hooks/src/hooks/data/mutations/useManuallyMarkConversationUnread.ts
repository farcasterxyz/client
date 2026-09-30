import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { useAddDirectCastConversationToInbox } from '../queries/directCastInbox/useAddDirectCastConversationToInbox';
import { useGetDirectCastInboxConversationByConversationId } from '../queries/directCastInbox/useGetDirectCastInboxConversationByConversationId';
import { useRemoveDirectCastConversationFromInbox } from '../queries/directCastInbox/useRemoveDirectCastConversationFromInbox';
import { useUpdateGloballyCachedDirectCastInboxConversation } from '../queries/globallyCachedDirectCastInboxConversation/useUpdateGloballyCachedDirectCastInboxConversation';

const useManuallyMarkConversationUnread = () => {
  const { apiClient } = useFarcasterApiClient();

  const updateGloballyCachedDirectCastInboxConversation =
    useUpdateGloballyCachedDirectCastInboxConversation();

  const updateDirectCastConversation = useUpdateDirectCastConversation();

  const getDirectCastInboxConversationByConversationId =
    useGetDirectCastInboxConversationByConversationId();

  const addDirectCastConversationToInbox =
    useAddDirectCastConversationToInbox();

  const removeDirectCastConversationFromInbox =
    useRemoveDirectCastConversationFromInbox();

  return useCallback(
    async ({
      fid,
      conversationId,
    }: {
      fid: number;
      conversationId: string;
    }) => {
      updateGloballyCachedDirectCastInboxConversation({
        updates: {
          conversationId: conversationId,
          viewerContext: {
            manuallyMarkedUnread: true,
          },
        },
      });

      updateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          viewerContext: {
            manuallyMarkedUnread: true,
          },
        },
      });

      const { conversation } = getDirectCastInboxConversationByConversationId({
        fid,
        category: 'default',
        conversationId,
      });

      if (conversation) {
        addDirectCastConversationToInbox({
          fid,
          conversation,
          category: 'default',
          filter: 'unread',
        });
      }

      try {
        await apiClient.manuallyMarkConversationUnread({
          conversationId,
        });
      } catch {
        // Undo optimistic update if API call fails.
        updateGloballyCachedDirectCastInboxConversation({
          updates: {
            conversationId: conversationId,
            viewerContext: {
              manuallyMarkedUnread: false,
            },
          },
        });

        updateDirectCastConversation({
          updates: {
            conversationId: conversationId,
            viewerContext: {
              manuallyMarkedUnread: false,
            },
          },
        });

        if (conversation) {
          removeDirectCastConversationFromInbox({
            fid,
            category: 'default',
            filter: 'unread',
            conversationId,
          });
        }
      }
    },
    [
      apiClient,
      updateGloballyCachedDirectCastInboxConversation,
      getDirectCastInboxConversationByConversationId,
      addDirectCastConversationToInbox,
      removeDirectCastConversationFromInbox,
      updateDirectCastConversation,
    ],
  );
};

export { useManuallyMarkConversationUnread };
