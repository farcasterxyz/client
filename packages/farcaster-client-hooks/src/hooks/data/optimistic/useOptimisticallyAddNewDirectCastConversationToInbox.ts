import { ApiUser } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { directCastConversationMessageTTLDays } from '../../../types';
import { useGetDirectCastConversation } from '../queries/directCastConversation/useGetDirectCastConversation';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { useAddDirectCastConversationToInbox } from '../queries/directCastInbox/useAddDirectCastConversationToInbox';
import { useRemoveDirectCastConversationFromInbox } from '../queries/directCastInbox/useRemoveDirectCastConversationFromInbox';
import { useOptimisticallyAddNewDirectCastConversation } from './useOptimisticallyAddNewDirectCastConversation';

const useOptimisticallyAddNewDirectCastConversationToInbox = () => {
  const getDirectCastConversation = useGetDirectCastConversation();

  const optimisticallyAddNewDirectCastConversation =
    useOptimisticallyAddNewDirectCastConversation();

  const addDirectCastConversationToInbox =
    useAddDirectCastConversationToInbox();

  const removeDirectCastConversationFromInbox =
    useRemoveDirectCastConversationFromInbox();

  const updateDirectCastConversation = useUpdateDirectCastConversation();

  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({
      currentUser,
      conversationId,
      counterParties,
    }: {
      currentUser: ApiUser;
      conversationId: string;
      counterParties: ApiUser[];
    }) => {
      const conversation = getDirectCastConversation({ conversationId });
      if (conversation) {
        // This moves the conversation to the top of the inbox it's in.
        removeDirectCastConversationFromInbox({
          fid: currentUser.fid,
          conversationId,
          category: conversation.viewerContext?.category,
        });
        addDirectCastConversationToInbox({
          fid: currentUser.fid,
          category: conversation.viewerContext?.category,
          conversation: {
            ...conversation,
            viewerContext: {
              ...conversation.viewerContext,
            },
          },
        });
        return;
      }

      const optimisticCounterParty = counterParties[0];
      optimisticallyAddNewDirectCastConversation({
        conversation: {
          conversationId: conversationId,
          adminFids: [],
          removedFids: [],
          participants: [...counterParties, currentUser],
          lastReadTime: 0,
          selfLastReadTime: 0,
          lastMessage: undefined,
          pinnedMessages: [],
          hasPinnedMessages: false,
          isGroup: false,
          isCollectionTokenGated: false,
          unreadCount: 0,
          name: undefined,
          muted: false,
          hasMention: false,
          groupPreferences: undefined,
          activeParticipantsCount: 0,
          description: undefined,
          photoUrl: undefined,
          messageTTLDays: directCastConversationMessageTTLDays,
          createdAt: Date.now(),
          viewerContext: {
            access: 'admin',
            archived: false,
            manuallyMarkedUnread: false,
            category: 'default',
            lastReadAt: 0,
            muted: false,
            pinned: false,
            unreadCount: 0,
            unreadMentionsCount: 0,
            unreadReactionMessage: undefined,
            counterParty: optimisticCounterParty,
            tag: undefined,
          },
        },
      });

      addDirectCastConversationToInbox({
        fid: currentUser.fid,
        category: 'default',
        conversation: {
          conversationId: conversationId,
          adminFids: [],
          name: undefined,
          description: undefined,
          photoUrl: undefined,
          lastReadTime: 0,
          createdAt: Date.now(),
          isGroup: false,
          viewerContext: {
            manuallyMarkedUnread: false,
            category: 'default',
            lastReadAt: 0,
            muted: false,
            pinned: false,
            unreadCount: 0,
            unreadMentionsCount: 0,
            unreadReactionMessage: undefined,
            counterParty: optimisticCounterParty,
            tag: undefined,
          },
        },
      });

      apiClient
        .getDirectCastConversation({
          conversationId,
        })
        .then(({ data }) => {
          const fetchedConversation = data?.result?.conversation;
          if (fetchedConversation) {
            // This updates the conversation with the fetched data.
            updateDirectCastConversation({
              updates: {
                ...fetchedConversation,
                conversationId,
                viewerContext: {
                  category: fetchedConversation.viewerContext?.category,
                },
              },
            });
            // This moves the conversation we optimistically added to the top of
            // the inbox before the fetch and adds it to the correct category.
            removeDirectCastConversationFromInbox({
              fid: currentUser.fid,
              conversationId,
              category: 'default',
            });
            addDirectCastConversationToInbox({
              fid: currentUser.fid,
              category: fetchedConversation.viewerContext?.category,
              conversation: {
                ...fetchedConversation,
                viewerContext: {
                  ...fetchedConversation.viewerContext,
                },
              },
            });
          }
        })
        .catch(() => {
          // Silently fail
        });
    },
    [
      optimisticallyAddNewDirectCastConversation,
      getDirectCastConversation,
      addDirectCastConversationToInbox,
      removeDirectCastConversationFromInbox,
      apiClient,
      updateDirectCastConversation,
    ],
  );
};

export { useOptimisticallyAddNewDirectCastConversationToInbox };
