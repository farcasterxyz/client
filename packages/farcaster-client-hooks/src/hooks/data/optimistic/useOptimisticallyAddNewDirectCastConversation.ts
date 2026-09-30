import { useQueryClient } from '@tanstack/react-query';
import { ApiDirectCastConversationInfoV3 } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastConversationKey } from '../queries/directCastConversation/buildDirectCastConversationKey';

const useOptimisticallyAddNewDirectCastConversation = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ conversation }: { conversation: ApiDirectCastConversationInfoV3 }) => {
      queryClient.setQueryData(
        buildDirectCastConversationKey({
          conversationId: conversation.conversationId,
        }),
        {
          result: {
            conversation,
          },
        },
      );
    },
    [queryClient],
  );
};

export { useOptimisticallyAddNewDirectCastConversation };
