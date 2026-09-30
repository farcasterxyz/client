import {
  ApiDirectCastConversationViewCategory,
  ApiDirectCastMessageMetadata,
  ApiDirectCastMessageType,
  ApiDirectCastMessageV3,
  ApiPutDirectCastV3200Response,
  isHandledFetchError,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyAddNewDirectCastMessage } from '../optimistic';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation';
import { useGetDirectCastInboxConversationByConversationId } from '../queries/directCastInbox/useGetDirectCastInboxConversationByConversationId';
import { useUpdateDirectCastInboxConversation } from '../queries/directCastInbox/useUpdateDirectCastInboxConversation';
import { useUpdateGloballyCachedDirectCastInboxConversation } from '../queries/globallyCachedDirectCastInboxConversation';
import { useAlterPlaintextDirectCastConversationCategory } from './useAlterPlaintextDirectCastConversationCategory';

export type SendDirectCastData = {
  conversationId: string;
  fid: number;
  recipientFids: number[];
  messageId: string;
  type: ApiDirectCastMessageType;
  message: string;
  optimisticInReplyTo?: ApiDirectCastMessageV3;
  optimisticMetadata?: ApiDirectCastMessageMetadata;
  senderContext: ApiDirectCastMessageV3['senderContext'];
  actionTakenUserContext?: ApiDirectCastMessageV3['actionTargetUserContext'];
  conversationCategory?: ApiDirectCastConversationViewCategory;
};

export type SendDirectCastParams = {
  data: SendDirectCastData;
  onOptimisticUpdate?: (message: ApiDirectCastMessageV3) => void;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

function getOptimisticMessageFromSendDirectCastData(
  data: SendDirectCastData,
): ApiDirectCastMessageV3 {
  return {
    conversationId: data.conversationId,
    type: data.type,
    message: data.message,
    messageId: data.messageId,
    reactions: [],
    senderFid: data.fid,
    serverTimestamp: Date.now(),
    metadata: data.optimisticMetadata,
    inReplyTo: data.optimisticInReplyTo,
    hasMention: false,
    isPinned: false,
    isDeleted: false,
    viewerContext: {
      focused: false,
      isLastReadMessage: true,
      reactions: [],
      isOptimistic: true,
    },
    senderContext: data.senderContext,
    actionTargetUserContext: data.actionTakenUserContext,
  };
}

const useSendDirectCast = () => {
  const { apiClient } = useFarcasterApiClient();

  const optimisticallyAddNewDirectCastMessage =
    useOptimisticallyAddNewDirectCastMessage();

  const updateGloballyCachedDirectCastInboxConversation =
    useUpdateGloballyCachedDirectCastInboxConversation();

  const updateDirectCastInboxConversation =
    useUpdateDirectCastInboxConversation();

  const updateDirectCastConversation = useUpdateDirectCastConversation();

  const getDirectCastInboxConversationByConversationId =
    useGetDirectCastInboxConversationByConversationId();

  const alterCategory = useAlterPlaintextDirectCastConversationCategory();

  return useCallback(
    async ({
      data,
      onOptimisticUpdate = () => undefined,
      onSuccess = () => undefined,
      onError = () => undefined,
    }: SendDirectCastParams): Promise<{
      data: ApiPutDirectCastV3200Response | undefined;
      error: unknown | undefined;
    }> => {
      const optimisticMessage =
        getOptimisticMessageFromSendDirectCastData(data);

      // Optimistically update the messages in conversation after a new DC
      optimisticallyAddNewDirectCastMessage({
        message: optimisticMessage,
      });

      updateDirectCastConversation({
        updates: {
          conversationId: data.conversationId,
          lastMessage: optimisticMessage,
          selfLastReadTime: Date.now(),
          viewerContext: {
            lastReadAt: Date.now(),
            unreadCount: 0,
            unreadMentionsCount: 0,
            unreadReactionMessage: undefined,
            manuallyMarkedUnread: false,
          },
        },
      });

      updateGloballyCachedDirectCastInboxConversation({
        updates: {
          conversationId: data.conversationId,
          lastMessage: optimisticMessage,
          viewerContext: {
            lastReadAt: Date.now(),
            unreadCount: 0,
            unreadMentionsCount: 0,
            unreadReactionMessage: undefined,
            manuallyMarkedUnread: false,
          },
        },
      });

      const existingConvoLastMessageToRevertOnFailure =
        getDirectCastInboxConversationByConversationId({
          fid: data.fid,
          conversationId: data.conversationId,
          category: data.conversationCategory,
        });

      updateDirectCastInboxConversation({
        fid: data.fid,
        category: data.conversationCategory,
        updates: {
          conversationId: data.conversationId,
          lastMessage: optimisticMessage,
          viewerContext: {
            lastReadAt: Date.now(),
            unreadCount: 0,
            unreadMentionsCount: 0,
            unreadReactionMessage: undefined,
            manuallyMarkedUnread: false,
          },
        },
      });

      // There isn't a single use case where we don't want to alter the convo state
      // except it is already determined to be on the default category.
      if (
        typeof data.conversationCategory === 'undefined' ||
        data.conversationCategory !== 'default'
      ) {
        try {
          await alterCategory({
            fid: data.fid,
            fromCategory: data.conversationCategory,
            toCategory: 'default',
            conversationId: data.conversationId,
          });
        } catch (error) {
          if (isHandledFetchError(error)) {
            // Should not block the sending of the message if convo possibly does not exist
            // yet.
            if (error.status !== 404) {
              throw error;
            }
          }
        }
      }

      onOptimisticUpdate(optimisticMessage);

      try {
        const { data: responseData } = await apiClient.putDirectCastV3({
          conversationId: data.conversationId,
          recipientFids: data.recipientFids,
          messageId: data.messageId,
          type: data.type,
          message: data.message,
          inReplyToId: data.optimisticInReplyTo?.messageId,
          clientProcessedMetadata: data.optimisticMetadata,
        });

        onSuccess();

        return { data: responseData, error: undefined };
      } catch (error) {
        updateDirectCastInboxConversation({
          fid: data.fid,
          category: data.conversationCategory,
          updates: {
            conversationId: data.conversationId,
            lastMessage:
              existingConvoLastMessageToRevertOnFailure?.conversation
                ?.lastMessage,
          },
        });

        onError(error);

        return { data: undefined, error };
      }
    },
    [
      alterCategory,
      apiClient,
      optimisticallyAddNewDirectCastMessage,
      updateDirectCastInboxConversation,
      updateGloballyCachedDirectCastInboxConversation,
      getDirectCastInboxConversationByConversationId,
      updateDirectCastConversation,
    ],
  );
};

export { getOptimisticMessageFromSendDirectCastData, useSendDirectCast };
