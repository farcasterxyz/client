import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { ApiGetDirectCastConversationMessages200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastConversationHistoricalMessagesKey } from '../queries/directCastConversationHistoricalMessages/buildDirectCastConversationHistoricalMessagesKey';
import { buildDirectCastConversationMessagesKey } from '../queries/directCastConversationMessages/buildDirectCastConversationMessagesKey';

type DirectCastConversationMessagesQueryData =
  ApiGetDirectCastConversationMessages200Response;

type DirectCastConversationMessagesQueryInfiniteData =
  InfiniteData<DirectCastConversationMessagesQueryData>;

const useOptimisticallySwapDirectCastMessagesWithArbitraryPoint = ({
  conversationId,
}: {
  conversationId: string;
}) => {
  const qc = useQueryClient();

  return useCallback(
    ({ messageId }: { messageId: string }): { messageIndex: number } => {
      const historicalMessagesQueryKey =
        buildDirectCastConversationHistoricalMessagesKey({
          conversationId,
          messageId,
        });
      const qd =
        qc.getQueryData<DirectCastConversationMessagesQueryInfiniteData>(
          historicalMessagesQueryKey,
        );

      if (typeof qd === 'undefined') {
        return { messageIndex: -1 };
      }

      const defaultMessagesQueryKey = buildDirectCastConversationMessagesKey({
        conversationId: conversationId,
        messageId: undefined,
      });

      const messageIndex = qd.pages
        .flatMap((p) => p.result.messages)
        .findIndex((o) => o.messageId === messageId);

      if (messageIndex === -1) {
        return { messageIndex: -1 };
      }

      qc.setQueryData(
        defaultMessagesQueryKey,
        () =>
          ({
            pageParams: qd.pageParams,
            pages: qd.pages,
          }) satisfies DirectCastConversationMessagesQueryInfiniteData,
      );

      return { messageIndex };
    },
    [conversationId, qc],
  );
};

export { useOptimisticallySwapDirectCastMessagesWithArbitraryPoint };
