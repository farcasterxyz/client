import { useCallback, useMemo } from 'react';

import { OnCreateFallback } from '../../../../types';
import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildDirectCastConversationMessagesKey } from './buildDirectCastConversationMessagesKey';
import { useDirectCastConversationMessages } from './useDirectCastConversationMessages';
import { useInvalidateDirectCastConversationMessages } from './useInvalidateDirectCastConversationMessages';

const useDirectCastConversationMessagesWithRefreshOnMount = ({
  conversationId,
  messageId,
  limit,
  onCreateFallback,
}: {
  conversationId: string;
  messageId: string | undefined;
  limit?: number;
  onCreateFallback?: OnCreateFallback;
}) => {
  const initialValue = useDirectCastConversationMessages({
    conversationId,
    messageId,
    limit,
    onCreateFallback,
  });

  const queryKey = useMemo(
    () => buildDirectCastConversationMessagesKey({ conversationId, messageId }),
    [conversationId, messageId],
  );

  const invalidateDirectCastConversationMessages =
    useInvalidateDirectCastConversationMessages();
  const invalidate = useCallback(() => {
    invalidateDirectCastConversationMessages({ conversationId, messageId });
  }, [conversationId, messageId, invalidateDirectCastConversationMessages]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useDirectCastConversationMessagesWithRefreshOnMount };
