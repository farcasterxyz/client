import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { ApiGetDirectCastConversationMessages200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';
import { buildDirectCastConversationRecentMessagesKey } from '../queries/directCastConversationRecentMessages/buildDirectCastConversationRecentMessagesKey';

const useOptimisticallySwapDirectCastMessagesWithRecent = ({
  conversationId,
}: {
  conversationId: string;
}) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    const recentMessagesQueryKey = buildDirectCastConversationRecentMessagesKey(
      {
        conversationId,
      },
    );
    const qd =
      queryClient.getQueryData<ApiGetDirectCastConversationMessages200Response>(
        recentMessagesQueryKey,
      );

    if (typeof qd === 'undefined') {
      return;
    }

    const messages = qd.result.messages.slice(0, 16);

    queryClient.setQueryData(
      buildDirectCastConversationMessagesKey({
        conversationId: conversationId,
        messageId: undefined,
      }),
      () => {
        return {
          pageParams: [],
          pages: [
            {
              result: { messages },
              next: undefined,
            },
          ],
        } satisfies InfiniteData<ApiGetDirectCastConversationMessages200Response>;
      },
    );
  }, [conversationId, queryClient]);
};

export { useOptimisticallySwapDirectCastMessagesWithRecent };
