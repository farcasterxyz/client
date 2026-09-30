import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationViewCategory,
  ApiGetDirectCastInbox200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastInboxByAccountKey } from './buildDirectCastInboxByAccountKey';

const useRemoveDirectCastConversationFromInbox = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      fid,
      category,
      conversationId,
      filter,
    }: {
      fid: number;
      category?: ApiDirectCastConversationViewCategory;
      conversationId: string;
      filter?: ApiDirectCastConversationFilter;
    }) => {
      queryClient.setQueryData(
        buildDirectCastInboxByAccountKey({
          fid,
          category,
          filter,
        }),
        (prev: InfiniteData<ApiGetDirectCastInbox200Response> | undefined) => {
          if (!prev) return undefined;
          return {
            pageParams: prev.pageParams,
            pages: prev.pages.map((p) => ({
              next: p.next,
              result: {
                ...p.result,
                conversations: p.result.conversations.filter(
                  (c) => c.conversationId !== conversationId,
                ),
              },
            })),
          } as InfiniteData<ApiGetDirectCastInbox200Response>;
        },
      );
    },
    [queryClient],
  );
};

const allCategories: (ApiDirectCastConversationViewCategory | undefined)[] = [
  'default',
  'archived',
  'request',
  undefined,
];

const allFilters: (ApiDirectCastConversationFilter | undefined)[] = [
  'unread',
  'group',
  '1-1',
  undefined,
];

const useRemoveDirectCastConversationFromAllInboxes = () => {
  const removeDirectCastConversationFromInbox =
    useRemoveDirectCastConversationFromInbox();
  return useCallback(
    ({ fid, conversationId }: { fid: number; conversationId: string }) => {
      for (const category of allCategories) {
        for (const filter of allFilters) {
          removeDirectCastConversationFromInbox({
            fid,
            category,
            filter,
            conversationId,
          });
        }
      }
    },
    [removeDirectCastConversationFromInbox],
  );
};

export {
  useRemoveDirectCastConversationFromAllInboxes,
  useRemoveDirectCastConversationFromInbox,
};
