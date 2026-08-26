import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastMessageV3,
  ApiGetDirectCastConversationMessages200Response,
  ApiWebSocketDirectCastReadMessage,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useWebSockets } from '../../../providers/WebSocketsProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';
import { useGetDirectCastInboxConversationByConversationId } from '../queries/directCastInbox/useGetDirectCastInboxConversationByConversationId';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';
import { useRemoveDirectCastConversationFromInbox } from '../queries/directCastInbox/useRemoveDirectCastConversationFromInbox';
import { useUpdateDirectCastInboxConversation } from '../queries/directCastInbox/useUpdateDirectCastInboxConversation';
import { useUpdateGloballyCachedDirectCastInboxConversation } from '../queries/globallyCachedDirectCastInboxConversation/useUpdateGloballyCachedDirectCastInboxConversation';

const useMarkConversationRead = () => {
  const queryClient = useQueryClient();

  const { apiClient } = useFarcasterApiClient();

  const { send } = useWebSockets();

  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();

  const updateGloballyCachedDirectCastInboxConversation =
    useUpdateGloballyCachedDirectCastInboxConversation();

  const updateDirectCastConversation = useUpdateDirectCastConversation();

  const removeDirectCastConversationFromInbox =
    useRemoveDirectCastConversationFromInbox();

  const updateDirectCastInboxConversation =
    useUpdateDirectCastInboxConversation();

  const getDireCastInboxConversation =
    useGetDirectCastInboxConversationByConversationId();

  return useCallback(
    async ({
      conversationId,
      fid,
      enabled = true,
    }: {
      conversationId: string;
      fid: number;
      enabled?: boolean;
    }) => {
      const { conversation } = getDireCastInboxConversation({
        fid,
        conversationId,
        category: 'default',
      });

      updateGloballyCachedDirectCastInboxConversation({
        updates: {
          conversationId: conversationId,
          viewerContext: {
            manuallyMarkedUnread: false,
            unreadCount: 0,
            lastReadAt: Date.now(),
            unreadReactionMessage: undefined,
          },
        },
      });

      updateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          selfLastReadTime: Date.now(),
          viewerContext: {
            manuallyMarkedUnread: false,
            unreadCount: 0,
            lastReadAt: Date.now(),
            unreadReactionMessage: undefined,
          },
        },
      });

      if (conversation?.viewerContext?.category === 'default') {
        removeDirectCastConversationFromInbox({
          fid,
          conversationId,
          category: 'default',
          filter: 'unread',
        });
      }

      updateDirectCastInboxConversation({
        fid,
        category: conversation?.viewerContext?.category ?? 'default',
        updates: {
          conversationId,
          viewerContext: {
            manuallyMarkedUnread: false,
            unreadCount: 0,
            lastReadAt: Date.now(),
          },
        },
      });

      queryClient.setQueryData(
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
                pages: prev.pages.map((p, index) => {
                  if (index !== 0 || p.result.messages.length === 0) {
                    return p;
                  }

                  const mostRecentMessage = p.result.messages[0];
                  const updatedMessages = [
                    {
                      ...mostRecentMessage,
                      viewerContext:
                        typeof mostRecentMessage.viewerContext !== 'undefined'
                          ? {
                              ...mostRecentMessage.viewerContext,
                              isLastReadMessage: typeof p.next === 'undefined',
                            }
                          : {
                              focused: false,
                              isLastReadMessage: typeof p.next === 'undefined',
                              reactions: [],
                            },
                    } satisfies ApiDirectCastMessageV3,
                    ...p.result.messages.slice(1),
                  ];

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

      if (!enabled) {
        return;
      }

      try {
        send({
          message: {
            messageType: 'direct-cast-read',
            payload: { conversationId },
            data: conversationId,
          } satisfies ApiWebSocketDirectCastReadMessage,
        });
      } catch {
        await apiClient.postDirectCastReadV3({
          conversationId,
        });

        invalidateDirectCastInboxByAccount({
          fid,
          category: 'default',
        });
        invalidateDirectCastInboxByAccount({
          fid,
          category: 'archived',
        });
      }
    },
    [
      apiClient,
      invalidateDirectCastInboxByAccount,
      updateGloballyCachedDirectCastInboxConversation,
      queryClient,
      send,
      getDireCastInboxConversation,
      updateDirectCastConversation,
      removeDirectCastConversationFromInbox,
      updateDirectCastInboxConversation,
    ],
  );
};

export { useMarkConversationRead };
