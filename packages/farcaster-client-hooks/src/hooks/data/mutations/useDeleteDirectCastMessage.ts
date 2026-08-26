import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { ApiGetDirectCastConversationMessages200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';

const useDeleteDirectCastMessage = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  return useCallback(
    async ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => {
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
                        return m.messageId === messageId
                          ? {
                              ...m,
                              message: 'You deleted this message',
                              isDeleted: true,
                            }
                          : m;
                      }),
                    },
                  };
                }),
              }
            : undefined,
      );

      await apiClient.deleteDirectCastMessage({
        conversationId: conversationId,
        messageId: messageId,
      });
    },
    [apiClient, qc],
  );
};

export { useDeleteDirectCastMessage };
