import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDirectCastConversationRecentMessagesKey } from './buildDirectCastConversationRecentMessagesKey';

const useInvalidateDirectCastConversationRecentMessages = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ conversationId }: { conversationId: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildDirectCastConversationRecentMessagesKey({
          conversationId,
        }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateDirectCastConversationRecentMessages };
