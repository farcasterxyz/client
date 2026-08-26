import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastMessageV3,
  ApiGetDirectCastConversationMessages200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useAggressivelyUpdateDirectCastConversation } from '../queries/directCastConversation/useAggressivelyUpdateDirectCastConversation';
import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';

const useUnpinDirectCastMessage = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  const optimisticallyUpdateDirectCastConversation =
    useAggressivelyUpdateDirectCastConversation();

  return useCallback(
    async ({
      fid: _,
      conversationId,
      message,
    }: {
      fid: number;
      conversationId: string;
      message: ApiDirectCastMessageV3;
    }) => {
      optimisticallyUpdateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          pinnedMessages: [],
          hasPinnedMessages: false,
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

                              isPinned: false,
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
        await apiClient.unpinDirectCastMessage({
          conversationId,
          messageId: message.messageId,
        });
      } catch {
        optimisticallyUpdateDirectCastConversation({
          updates: {
            conversationId: conversationId,
            pinnedMessages: [message],
            hasPinnedMessages: true,
          },
        });
      }
    },
    [apiClient, optimisticallyUpdateDirectCastConversation, qc],
  );
};

export { useUnpinDirectCastMessage };
