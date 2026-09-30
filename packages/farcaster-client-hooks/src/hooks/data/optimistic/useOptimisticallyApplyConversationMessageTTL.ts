import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastConversationMessageTTLDays,
  ApiGetDirectCastConversation200Response,
  ApiGetDirectCastConversationMessages200Response,
  ApiGetDirectCastConversationRecentMessages200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastConversationKey } from '../queries/directCastConversation/buildDirectCastConversationKey';
import { useInvalidateDirectCastConversationHistoricalMessages } from '../queries/directCastConversationHistoricalMessages/useInvalidateDirectCastConversationHistoricalMessages';
import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';
import { buildDirectCastConversationRecentMessagesKey } from '../queries/directCastConversationRecentMessages/buildDirectCastConversationRecentMessagesKey';

/**
 * Returns a callback that can be used to optimistically apply a message TTL to a conversation.
 * Meaning, it will remove cached messages from the conversation that are older than the given TTL.
 *
 */
const useOptimisticallyApplyConversationMessageTTL = () => {
  const queryClient = useQueryClient();

  const invalidateDirectCastConversationHistoricalMessages =
    useInvalidateDirectCastConversationHistoricalMessages();

  /**
   * @param arg - If empty, it will apply the message TTL to all conversations in the cache. If set, it will apply the
   * given message TTL to the conversation with the given ID.
   */
  const applyMessageTTL = useCallback(
    (arg?: {
      conversationId: string;
      messageTTL: ApiDirectCastConversationMessageTTLDays;
    }) => {
      if (!arg) {
        const key = buildDirectCastConversationKey({
          conversationId: undefined,
        });
        const entries =
          queryClient.getQueriesData<ApiGetDirectCastConversation200Response>({
            queryKey: key,
          });
        for (const entry of entries) {
          const data = entry[1] as
            | ApiGetDirectCastConversation200Response
            | undefined;
          if (data) {
            applyMessageTTL({
              conversationId: data.result.conversation.conversationId,
              messageTTL: data.result.conversation.messageTTLDays,
            });
          }
        }
        return;
      }

      const { conversationId, messageTTL } = arg;

      const minMessageTimestamp =
        messageTTL === 'Infinity'
          ? 0
          : Date.now() - messageTTL * 24 * 60 * 60 * 1000;
      const defaultMessagesQueryKey = buildDirectCastConversationMessagesKey({
        conversationId: conversationId,
        messageId: undefined,
      });
      const recentMessagesQueryKey =
        buildDirectCastConversationRecentMessagesKey({
          conversationId,
        });

      queryClient.setQueryData(
        defaultMessagesQueryKey,
        (
          prev:
            | InfiniteData<ApiGetDirectCastConversationMessages200Response>
            | undefined,
        ):
          | InfiniteData<ApiGetDirectCastConversationMessages200Response>
          | undefined => {
          if (!prev) return undefined;
          if (prev.pages.length === 0) return prev;

          const updated = {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              result: {
                ...page.result,
                messages: page.result.messages.filter(
                  (c) => c.serverTimestamp > minMessageTimestamp,
                ),
              },
            })),
          } as InfiniteData<ApiGetDirectCastConversationMessages200Response>;

          return updated;
        },
      );

      queryClient.setQueryData<ApiGetDirectCastConversationRecentMessages200Response>(
        recentMessagesQueryKey,
        (
          prev:
            | ApiGetDirectCastConversationRecentMessages200Response
            | undefined,
        ):
          | ApiGetDirectCastConversationRecentMessages200Response
          | undefined => {
          if (!prev) return prev;
          if (prev.result.messages.length === 0) return prev;

          return {
            ...prev,
            result: {
              messages: prev.result.messages.filter(
                (c) => c.serverTimestamp > minMessageTimestamp,
              ),
            },
          };
        },
      );
      invalidateDirectCastConversationHistoricalMessages({
        conversationId,
        messageId: undefined,
      });
    },
    [invalidateDirectCastConversationHistoricalMessages, queryClient],
  );
  return applyMessageTTL;
};

export { useOptimisticallyApplyConversationMessageTTL };
