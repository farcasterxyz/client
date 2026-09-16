import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastInboxConversationInfoV3,
  ApiGetDirectCastInbox200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { buildDirectCastInboxByAccountKey } from '../queries/directCastInbox/buildDirectCastInboxByAccountKey';
import { useUpdateGloballyCachedDirectCastInboxConversation } from '../queries/globallyCachedDirectCastInboxConversation';

const usePinDirectCastConversation = () => {
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

      queryClient.setQueryData(
        buildDirectCastInboxByAccountKey({
          fid,
          category: 'default',
        }),
        (prev: InfiniteData<ApiGetDirectCastInbox200Response> | undefined) => {
          if (typeof prev === 'undefined') {
            return undefined;
          }

          let conversationToPin:
            | ApiDirectCastInboxConversationInfoV3
            | undefined;

          const updatedPages = prev.pages.map((page) => {
            const conversationIndex = page.result.conversations.findIndex(
              (c) => c.conversationId === conversationId,
            );

            // Find the conversation to pin and remove it from its current page.
            if (conversationIndex !== -1) {
              conversationToPin = page.result.conversations[conversationIndex];
              return {
                ...page,
                result: {
                  ...page.result,
                  conversations: page.result.conversations.filter(
                    (_, index) => index !== conversationIndex,
                  ),
                },
              };
            }

            return page;
          });

          // Add the conversation to the beginning of the first page.
          if (conversationToPin && updatedPages.length > 0) {
            updatedPages[0] = {
              ...updatedPages[0],
              result: {
                ...updatedPages[0].result,
                conversations: [
                  conversationToPin,
                  ...updatedPages[0].result.conversations,
                ],
              },
            };
          }

          return {
            ...prev,
            pages: updatedPages,
          };
        },
      );

      try {
        await apiClient.pinDirectCastConversation({
          conversationId,
        });
      } catch {
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
      }
    },
    [
      queryClient,
      apiClient,
      updateGloballyCachedDirectCastInboxConversation,
      updateDirectCastConversation,
    ],
  );
};

export { usePinDirectCastConversation };
