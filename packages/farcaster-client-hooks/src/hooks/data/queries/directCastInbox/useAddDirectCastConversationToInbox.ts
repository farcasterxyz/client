import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationViewCategory,
  ApiDirectCastInboxConversationInfoV3,
  ApiGetDirectCastInbox200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastInboxByAccountKey } from './buildDirectCastInboxByAccountKey';

const useAddDirectCastConversationToInbox = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      fid,
      conversation,
      category,
      filter,
    }: {
      fid: number;
      conversation: ApiDirectCastInboxConversationInfoV3;
      category?: ApiDirectCastConversationViewCategory;
      filter?: ApiDirectCastConversationFilter;
    }) => {
      queryClient.setQueryData(
        buildDirectCastInboxByAccountKey({
          fid,
          category,
          filter,
        }),
        (
          prev: InfiniteData<ApiGetDirectCastInbox200Response> | undefined,
        ): InfiniteData<ApiGetDirectCastInbox200Response> | undefined => {
          if (!prev) return undefined;
          if (!conversation.conversationId || prev.pages.length === 0)
            return prev;

          const [firstPage, ...rest] = prev.pages;
          const updated = {
            ...prev,
            pages: [
              {
                ...firstPage,
                result: {
                  ...firstPage.result,
                  conversations: [
                    ...firstPage.result.conversations.filter(
                      (c) =>
                        c.viewerContext.pinned &&
                        c.conversationId !== conversation.conversationId,
                    ),
                    {
                      ...conversation,
                      viewerContext: {
                        ...conversation.viewerContext,
                        category,
                      },
                    },
                    ...firstPage.result.conversations.filter(
                      (c) =>
                        !c.viewerContext.pinned &&
                        c.conversationId !== conversation.conversationId,
                    ),
                  ],
                },
              },
              ...rest,
            ],
          } as InfiniteData<ApiGetDirectCastInbox200Response>;

          return updated;
        },
      );
    },
    [queryClient],
  );
};

export { useAddDirectCastConversationToInbox };
