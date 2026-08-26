import {
  ApiDirectCastConversationMessageTTLDays,
  ApiDirectCastMessageV3,
} from 'farcaster-client-data';
import { generateMessageId } from 'farcaster-cryptography';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import {
  useOptimisticallyAddNewDirectCastMessage,
  useOptimisticallyApplyConversationMessageTTL,
} from '../optimistic';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';

type SenderContext = {
  fid: number;
  displayName: string;
  username: string | undefined;
};

const useUpdateConversationMessageTTL = () => {
  const { apiClient } = useFarcasterApiClient();

  const optimisticallyUpdateDirectCastConversation =
    useUpdateDirectCastConversation();

  const optimisticallyAddNewDirectCastMessage =
    useOptimisticallyAddNewDirectCastMessage();

  const optimisticallyApplyConversationMessageTTL =
    useOptimisticallyApplyConversationMessageTTL();

  return useCallback(
    async ({
      senderContext,
      conversationId,
      ttl,
    }: {
      senderContext: SenderContext;
      conversationId: string;
      ttl: ApiDirectCastConversationMessageTTLDays;
    }) => {
      optimisticallyUpdateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          messageTTLDays: ttl,
        },
      });

      optimisticallyApplyConversationMessageTTL({
        conversationId,
        messageTTL: ttl,
      });

      const { data } = await apiClient.postDirectCastConversationMessageTTL({
        conversationId,
        ttl,
      });

      const newMessageId = generateMessageId();
      const optimisticMessage = {
        conversationId,
        type: 'message_ttl_change',
        message: `${ttl}`,
        messageId: newMessageId,
        reactions: [],
        senderFid: senderContext.fid,
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
          fid: senderContext.fid,
          displayName: senderContext.displayName,
          username: senderContext.username,
        },
      } satisfies ApiDirectCastMessageV3;
      optimisticallyAddNewDirectCastMessage({
        message: optimisticMessage,
      });

      return data;
    },
    [
      apiClient,
      optimisticallyUpdateDirectCastConversation,
      optimisticallyAddNewDirectCastMessage,
      optimisticallyApplyConversationMessageTTL,
    ],
  );
};

export { useUpdateConversationMessageTTL };
