import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastMessageV3,
  ApiGetDirectCastConversationMessages200Response,
  ApiGetDirectCastConversationRecentMessages200Response,
  DirectCastsConversationMessagesCursor,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';
import { buildDirectCastConversationRecentMessagesKey } from '../queries/directCastConversationRecentMessages/buildDirectCastConversationRecentMessagesKey';

const useOptimisticallyAddNewDirectCastMessage = () => {
  const queryClient = useQueryClient();
  const updateDirectCastConversation = useUpdateDirectCastConversation();

  return useCallback(
    ({ message }: { message: ApiDirectCastMessageV3 }) => {
      queryClient.setQueryData(
        buildDirectCastConversationMessagesKey({
          conversationId: message.conversationId,
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
                pages: prev.pages.map((p, index) => {
                  // New message should only be inserted to the first page
                  const shouldInsertMessageSinceAlreadyOnLatestMessageSet =
                    index === 0 &&
                    (typeof p.next === 'undefined' ||
                      typeof p.next.cursor === 'undefined' ||
                      typeof (
                        JSON.parse(
                          Buffer.from(p.next.cursor, 'base64').toString(),
                        ) as DirectCastsConversationMessagesCursor
                      ).after === 'undefined');

                  const updatedMessages =
                    shouldInsertMessageSinceAlreadyOnLatestMessageSet
                      ? [
                          message,
                          ...p.result.messages.filter(
                            (m) => m.messageId !== message.messageId,
                          ),
                        ]
                      : p.result.messages;

                  return {
                    next: p.next,
                    result: {
                      messages: updatedMessages,
                    },
                  };
                }),
              }
            : undefined,
      );

      queryClient.setQueryData(
        buildDirectCastConversationRecentMessagesKey({
          conversationId: message.conversationId,
        }),
        (
          prev:
            | ApiGetDirectCastConversationRecentMessages200Response
            | undefined,
        ) => {
          return {
            result: {
              messages:
                typeof prev !== 'undefined'
                  ? [
                      message,
                      ...prev.result.messages.filter(
                        (m) => m.messageId !== message.messageId,
                      ),
                    ]
                  : [message],
            },
          } satisfies ApiGetDirectCastConversationRecentMessages200Response;
        },
      );

      updateDirectCastConversation({
        updates: {
          conversationId: message.conversationId,
          lastMessage: message,
        },
      });
    },
    [queryClient, updateDirectCastConversation],
  );
};

export { useOptimisticallyAddNewDirectCastMessage };
