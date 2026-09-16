import type { ApiDirectCastMessageV3, ApiUser } from 'farcaster-client-data';
import { generateMessageId } from 'farcaster-cryptography';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyAddNewDirectCastMessage } from '../optimistic';
import { useAggressivelyUpdateDirectCastConversation } from '../queries/directCastConversation/useAggressivelyUpdateDirectCastConversation';
import { useGetDirectCastConversation } from '../queries/directCastConversation/useGetDirectCastConversation';
import { useInvalidateDirectCastConversationMessages } from '../queries/directCastConversationMessages/useInvalidateDirectCastConversationMessages';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';
import { useRemoveDirectCastConversationFromAllInboxes } from '../queries/directCastInbox/useRemoveDirectCastConversationFromInbox';

type SenderContext = {
  fid: number;
  displayName: string;
  username: string | undefined;
};

const useChangeMemberInPlaintextDirectCastGroup = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();

  const invalidateDirectCastConversationMessages =
    useInvalidateDirectCastConversationMessages();

  const getDirectCastConversation = useGetDirectCastConversation();

  const updateDirectCastConversation =
    useAggressivelyUpdateDirectCastConversation();

  const optimisticallyAddNewDirectCastMessage =
    useOptimisticallyAddNewDirectCastMessage();

  const removeDirectCastConversationFromAllInboxes =
    useRemoveDirectCastConversationFromAllInboxes();

  return useCallback(
    async ({
      senderContext,
      participants,
      inviteCode,
      action,
      conversationId,
    }: {
      senderContext: SenderContext;
      participants: ApiUser[];
      inviteCode?: string;
      conversationId: string;
      action: 'remove' | 'add' | 'promote' | 'demote';
    }) => {
      const conversation = getDirectCastConversation({
        conversationId,
      });
      const fid = senderContext.fid;
      let viewerLeftGroup = false;
      if (conversation) {
        const newConversation = { ...conversation };
        if (action === 'add') {
          const newParticipants = participants.filter((p) => {
            return (
              !conversation.participants.some((cp) => cp.fid === p.fid) &&
              p.viewerContext?.canAddToGroupDirectly
            );
          });
          if (newParticipants.length > 0) {
            newConversation.participants = [
              ...conversation.participants,
              ...newParticipants,
            ];
          }
          newConversation.removedFids = conversation.removedFids?.filter(
            (fid) => !newParticipants.map((p) => p.fid).includes(fid),
          );
          for (const participant of newParticipants) {
            const newMessageId = generateMessageId();
            const optimisticMessage = {
              conversationId,
              type: 'group_membership_addition',
              message: `${participant.fid}`,
              messageId: newMessageId,
              reactions: [],
              senderFid: fid,
              serverTimestamp: Date.now(),
              metadata: {},
              inReplyTo: undefined,
              hasMention: false,
              isPinned: false,
              isDeleted: false,
              viewerContext: {
                focused: false,
                isLastReadMessage: true,
                reactions: [],
                isOptimistic: true,
              },
              senderContext: {
                fid,
                displayName: senderContext.displayName,
                username: senderContext.username,
              },
              actionTargetUserContext: {
                fid: participant.fid,
                displayName: participant.displayName,
                username: participant.username,
              },
            } satisfies ApiDirectCastMessageV3;
            optimisticallyAddNewDirectCastMessage({
              message: optimisticMessage,
            });
          }
        } else if (action === 'remove') {
          newConversation.removedFids = [
            ...conversation.removedFids.filter(
              (fid) => !participants.map((p) => p.fid).includes(fid),
            ),
            ...participants.map((p) => p.fid),
          ];
          viewerLeftGroup = newConversation.removedFids.includes(fid);
          for (const participant of participants) {
            const newMessageId = generateMessageId();
            const optimisticMessage = {
              conversationId,
              type: 'group_membership_removal',
              message: `${participant.fid}`,
              messageId: newMessageId,
              reactions: [],
              senderFid: fid,
              serverTimestamp: Date.now(),
              metadata: {},
              inReplyTo: undefined,
              hasMention: false,
              isPinned: false,
              isDeleted: false,
              viewerContext: {
                focused: false,
                isLastReadMessage: true,
                reactions: [],
                isOptimistic: true,
              },
              senderContext: {
                fid,
                displayName: senderContext.displayName,
                username: senderContext.username,
              },
              actionTargetUserContext: {
                fid: participant.fid,
                displayName: participant.displayName,
                username: participant.username,
              },
            } satisfies ApiDirectCastMessageV3;
            optimisticallyAddNewDirectCastMessage({
              message: optimisticMessage,
            });
          }
        } else if (action === 'promote') {
          newConversation.adminFids = [
            ...conversation.adminFids.filter(
              (fid) => !participants.map((p) => p.fid).includes(fid),
            ),
            ...participants.map((p) => p.fid),
          ];
        } else if (action === 'demote') {
          newConversation.adminFids = conversation.adminFids?.filter(
            (fid) => !participants.map((p) => p.fid).includes(fid),
          );
        }
        updateDirectCastConversation({
          updates: newConversation,
        });
      }

      if (participants.length === 1) {
        try {
          await apiClient.postDirectCastGroupMembershipV3({
            conversationId,
            targetFid: participants[0].fid,
            inviteCode,
            action,
          });
        } catch (e) {
          if (conversation) {
            updateDirectCastConversation({
              updates: conversation,
            });
          }
          throw e;
        } finally {
          invalidateDirectCastInboxByAccount({
            fid,
            category: 'default',
          });
          invalidateDirectCastInboxByAccount({
            fid,
            category: 'archived',
          });
          invalidateDirectCastConversationMessages({
            conversationId,
            messageId: undefined,
          });
          if (viewerLeftGroup) {
            removeDirectCastConversationFromAllInboxes({
              fid,
              conversationId,
            });
          }
        }
      }
      if (participants.length > 1) {
        try {
          await apiClient.postDirectCastGroupMembershipV3({
            conversationId,
            targetFids: participants.map((p) => p.fid),
            action,
          });
        } catch (e) {
          if (conversation) {
            updateDirectCastConversation({
              updates: conversation,
            });
          }
          throw e;
        } finally {
          invalidateDirectCastInboxByAccount({
            fid,
            category: 'default',
          });
          invalidateDirectCastInboxByAccount({
            fid,
            category: 'archived',
          });
          if (viewerLeftGroup) {
            removeDirectCastConversationFromAllInboxes({
              fid,
              conversationId,
            });
          }
        }
      }
    },
    [
      apiClient,
      invalidateDirectCastInboxByAccount,
      invalidateDirectCastConversationMessages,
      getDirectCastConversation,
      updateDirectCastConversation,
      optimisticallyAddNewDirectCastMessage,
      removeDirectCastConversationFromAllInboxes,
    ],
  );
};

export { useChangeMemberInPlaintextDirectCastGroup };
