import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildDirectCastConversationRecentMessagesKey } from './buildDirectCastConversationRecentMessagesKey';
import { useDirectCastConversationRecentMessages } from './useDirectCastConversationRecentMessages';
import { useInvalidateDirectCastConversationRecentMessages } from './useInvalidateDirectCastConversationRecentMessages';

const useDirectCastConversationRecentMessagesWithRefreshOnMount = ({
  conversationId,
}: {
  conversationId: string;
}) => {
  const initialValue = useDirectCastConversationRecentMessages({
    conversationId,
  });

  const queryKey = useMemo(
    () =>
      buildDirectCastConversationRecentMessagesKey({
        conversationId,
      }),
    [conversationId],
  );

  const invalidateDirectCastConversationRecentMessages =
    useInvalidateDirectCastConversationRecentMessages();
  const invalidate = useCallback(() => {
    invalidateDirectCastConversationRecentMessages({
      conversationId,
    });
  }, [conversationId, invalidateDirectCastConversationRecentMessages]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useDirectCastConversationRecentMessagesWithRefreshOnMount };
