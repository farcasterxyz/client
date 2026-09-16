import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { ApiGetDirectCastInbox200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { buildDirectCastInboxByAccountKey } from '../queries/directCastInbox/buildDirectCastInboxByAccountKey';
import { useUpdateGloballyCachedDirectCastInboxConversation } from '../queries/globallyCachedDirectCastInboxConversation/useUpdateGloballyCachedDirectCastInboxConversation';

const useUnpinDirectCastConversation = () => {
  const { apiClient } = useFarcasterApiClient();

  const queryClient = useQueryClient();

  const updateGloballyCachedDirectCastInboxConversation =
    useUpdateGloballyCachedDirectCastInboxConversation();
  const updateDirectCastConversation = useUpdateDirectCastConversation();

  return useCallback(
    async ({
      fid,
      conversationId,
    }: {
      fid: number;
      conversationId: string;
    }) => {
      updateGloballyCachedDirectCastInboxConversation({
        updates: {
          conversationId: conversationId,
          viewerContext: {
            pinned: false,
          },
        },
      });

      updateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          viewerContext: {
            pinned: false,
          },
        },
      });

      queryClient.setQueryData(
        buildDirectCastInboxByAccountKey({
          fid,
          category: 'default',
        }),
        (prev: InfiniteData<ApiGetDirectCastInbox200Response> | undefined) => {
          if (typeof prev === 'undefined') {
            return undefined;
          }

          return {
            pageParams: prev.pageParams,
            pages: prev.pages.map((page) => {
              const conversationToUpdate = page.result.conversations.find(
                (c) => c.conversationId === conversationId,
              );

              if (typeof conversationToUpdate === 'undefined') {
                return { ...page };
              }

              // Move the conversation after pinned conversations
              const pinnedConversations = page.result.conversations.filter(
                (c) =>
                  c.viewerContext?.pinned &&
                  c.conversationId !== conversationId,
              );
              const unpinnedConversations = page.result.conversations.filter(
                (c) =>
                  !c.viewerContext?.pinned &&
                  c.conversationId !== conversationId,
              );
              const conversations = [
                ...pinnedConversations,
                conversationToUpdate,
                ...unpinnedConversations,
              ];

              return {
                next: page.next,
                result: {
                  ...page.result,
                  conversations: conversations,
                },
              } satisfies ApiGetDirectCastInbox200Response;
            }),
          };
        },
      );

      try {
        await apiClient.unpinDirectCastConversation({
          conversationId,
        });
      } catch {
        updateGloballyCachedDirectCastInboxConversation({
          updates: {
            conversationId: conversationId,
            viewerContext: {
              pinned: true,
            },
          },
        });
        updateDirectCastConversation({
          updates: {
            conversationId: conversationId,
            viewerContext: {
              pinned: true,
            },
          },
        });
      }
    },
    [
      apiClient,
      updateGloballyCachedDirectCastInboxConversation,
      updateDirectCastConversation,
      queryClient,
    ],
  );
};

export { useUnpinDirectCastConversation };
