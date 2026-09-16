import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDirectCastConversationMessagesKey } from './buildDirectCastConversationMessagesKey';

const useInvalidateDirectCastConversationMessages = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string | undefined;
    }) => {
      queryClient.invalidateQueries({
        queryKey: buildDirectCastConversationMessagesKey({
          conversationId,
          messageId,
        }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateDirectCastConversationMessages };
