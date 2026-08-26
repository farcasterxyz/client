import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDirectCastConversationKey } from './buildDirectCastConversationKey';

const useInvalidateDirectCastConversation = ({
  conversationId,
}: {
  conversationId: string;
}) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildDirectCastConversationKey({ conversationId }),
    });
  }, [conversationId, queryClient]);
};

export { useInvalidateDirectCastConversation };
