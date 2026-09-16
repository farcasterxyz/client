import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationViewCategory,
  ApiDirectCastInboxConversationInfoV3,
  ApiGetDirectCastInbox200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastInboxByAccountKey } from './buildDirectCastInboxByAccountKey';

const useGetDirectCastInboxConversationByConversationId = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      fid,
      category,
      filter,
      conversationId,
    }: {
      fid: number;
      category?: ApiDirectCastConversationViewCategory;
      filter?: ApiDirectCastConversationFilter;
      conversationId: string;
    }): {
      conversation: ApiDirectCastInboxConversationInfoV3 | undefined;
    } => {
      const fromPages = queryClient.getQueryData<
        InfiniteData<ApiGetDirectCastInbox200Response>
      >(
        buildDirectCastInboxByAccountKey({
          fid,
          category,
          filter,
        }),
      );

      const conversation = fromPages?.pages.reduce(
        (acc, page) => {
          if (acc) return acc;
          return page.result.conversations.find(
            (conversation) => conversation.conversationId === conversationId,
          );
        },
        undefined as ApiDirectCastInboxConversationInfoV3 | undefined,
      );

      return { conversation };
    },
    [queryClient],
  );
};

export { useGetDirectCastInboxConversationByConversationId };
