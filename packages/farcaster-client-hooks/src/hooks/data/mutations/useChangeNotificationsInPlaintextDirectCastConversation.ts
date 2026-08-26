import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { ApiGetDirectCastInbox200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { useInvalidateDirectCastConversationMessages } from '../queries/directCastConversationMessages/useInvalidateDirectCastConversationMessages';
import { buildDirectCastInboxByAccountKey } from '../queries/directCastInbox/buildDirectCastInboxByAccountKey';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';
import { useMergeIntoGloballyCachedDirectCastInboxConversation } from '../queries/globallyCachedDirectCastInboxConversation/useMergeIntoGloballyCachedDirectCastInboxConversation';

const useChangeNotificationsInPlaintextDirectCastConversation = () => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedDirectCastInboxConversation =
    useMergeIntoGloballyCachedDirectCastInboxConversation();

  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();
  const invalidateDirectCastConversationMessages =
    useInvalidateDirectCastConversationMessages();

  const optimisticallyUpdateDirectCastConversation =
    useUpdateDirectCastConversation();

  const queryClient = useQueryClient();

  return useCallback(
    async ({
      fid,
      conversationId,
      muted,
    }: {
      fid: number;
      conversationId: string;
      muted: boolean;
    }) => {
      optimisticallyUpdateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          muted: muted,
          viewerContext: {
            muted: muted,
          },
        },
      });

      [
        buildDirectCastInboxByAccountKey({
          fid,
          category: 'default',
        }),
        buildDirectCastInboxByAccountKey({
          fid,
          category: 'archived',
        }),
      ].map((key) =>
        queryClient.setQueryData(
          key,
          (
            data: InfiniteData<ApiGetDirectCastInbox200Response> | undefined,
          ) => {
            return data
              ? {
                  pages: data.pages.map((p) => ({
                    next: p.next,
                    result: {
                      ...p.result,
                      conversations: p.result.conversations.map((c) => {
                        if (c.conversationId === conversationId) {
                          const updatedConvo = {
                            ...c,
                            viewerContext: {
                              ...c.viewerContext,
                              muted,
                            },
                          };

                          mergeIntoGloballyCachedDirectCastInboxConversation({
                            updates: updatedConvo,
                          });

                          return updatedConvo;
                        }

                        return c;
                      }),
                    },
                  })),
                  pageParams: data.pageParams,
                }
              : undefined;
          },
        ),
      );

      const { data } =
        await apiClient.postDirectCastConversationNotificationsV3({
          conversationId,
          muted,
        });

      invalidateDirectCastInboxByAccount({
        fid,
        category: 'default',
      });
      invalidateDirectCastInboxByAccount({
        fid,
        category: 'archived',
      });
      invalidateDirectCastConversationMessages({
        conversationId,
        messageId: undefined,
      });
      return data;
    },
    [
      optimisticallyUpdateDirectCastConversation,
      apiClient,
      invalidateDirectCastInboxByAccount,
      invalidateDirectCastConversationMessages,
      queryClient,
      mergeIntoGloballyCachedDirectCastInboxConversation,
    ],
  );
};

export { useChangeNotificationsInPlaintextDirectCastConversation };
