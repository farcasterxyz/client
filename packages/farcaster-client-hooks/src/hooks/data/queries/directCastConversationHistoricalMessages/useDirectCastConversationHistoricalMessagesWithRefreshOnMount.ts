import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildDirectCastConversationHistoricalMessagesKey } from './buildDirectCastConversationHistoricalMessagesKey';
import { useDirectCastConversationHistoricalMessages } from './useDirectCastConversationHistoricalMessages';
import { useInvalidateDirectCastConversationHistoricalMessages } from './useInvalidateDirectCastConversationHistoricalMessages';

const useDirectCastConversationHistoricalMessagesWithRefreshOnMount = ({
  conversationId,
  messageId,
  limit,
}: {
  conversationId: string;
  messageId: string;
  limit: number;
}) => {
  const initialValue = useDirectCastConversationHistoricalMessages({
    conversationId,
    messageId,
    limit,
  });

  const queryKey = useMemo(
    () =>
      buildDirectCastConversationHistoricalMessagesKey({
        conversationId,
        messageId,
      }),
    [conversationId, messageId],
  );

  const invalidateDirectCastConversationHistoricalMessages =
    useInvalidateDirectCastConversationHistoricalMessages();
  const invalidate = useCallback(() => {
    invalidateDirectCastConversationHistoricalMessages({
      conversationId,
      messageId,
    });
  }, [
    conversationId,
    messageId,
    invalidateDirectCastConversationHistoricalMessages,
  ]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useDirectCastConversationHistoricalMessagesWithRefreshOnMount };
