import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastMessageV3,
  ApiGetDirectCastConversationMessages200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';
import { useInvalidateDirectCastConversationMessages } from '../queries/directCastConversationMessages/useInvalidateDirectCastConversationMessages';

const usePinDirectCastMessage = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  const optimisticallyUpdateDirectCastConversation =
    useUpdateDirectCastConversation();

  const invalidateDirectCastConversationMessages =
    useInvalidateDirectCastConversationMessages();

  return useCallback(
    async ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: ApiDirectCastMessageV3;
    }) => {
      optimisticallyUpdateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          // TODO: This works for the single pinned message case but once we
          // allow multiple it will need to be converted to a push. When we have
          // that feature it will require client updates so feeling okay with this
          // assumption here for now.
          pinnedMessages: [message],
          hasPinnedMessages: true,
        },
      });

      qc.setQueryData(
        buildDirectCastConversationMessagesKey({
          conversationId,
          messageId: undefined,
        }),
        (
          prev:
            | InfiniteData<ApiGetDirectCastConversationMessages200Response>
            | undefined,
        ) =>
          prev
            ? {
                ...prev,
                pages: prev.pages.map((p) => {
                  return {
                    next: p.next,
                    result: {
                      ...p.result,
                      messages: p.result.messages.map((m) => {
                        return m.messageId === message.messageId
                          ? {
                              ...m,
                              isPinned: true,
                            }
                          : m;
                      }),
                    },
                  };
                }),
              }
            : undefined,
      );

      try {
        await apiClient.pinDirectCastMessage({
          conversationId,
          messageId: message.messageId,
        });

        invalidateDirectCastConversationMessages({
          conversationId: conversationId,
          messageId: undefined,
        });
      } catch {
        optimisticallyUpdateDirectCastConversation({
          updates: {
            conversationId: conversationId,
            pinnedMessages: [],
            hasPinnedMessages: false,
          },
        });
      }
    },
    [
      apiClient,
      invalidateDirectCastConversationMessages,
      optimisticallyUpdateDirectCastConversation,
      qc,
    ],
  );
};

export { usePinDirectCastMessage };
