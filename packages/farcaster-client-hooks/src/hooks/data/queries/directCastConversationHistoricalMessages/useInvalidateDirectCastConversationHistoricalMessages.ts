import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDirectCastConversationHistoricalMessagesKey } from './buildDirectCastConversationHistoricalMessagesKey';

const useInvalidateDirectCastConversationHistoricalMessages = () => {
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
        queryKey: buildDirectCastConversationHistoricalMessagesKey({
          conversationId,
          messageId,
        }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateDirectCastConversationHistoricalMessages };
