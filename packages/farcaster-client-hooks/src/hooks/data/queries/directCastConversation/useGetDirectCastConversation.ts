import { useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastConversationInfoV3,
  ApiGetDirectCastConversation200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastConversationKey } from './buildDirectCastConversationKey';

const useGetDirectCastConversation = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      conversationId,
    }: {
      conversationId: string;
    }): ApiDirectCastConversationInfoV3 | undefined => {
      return queryClient.getQueryData<ApiGetDirectCastConversation200Response>(
        buildDirectCastConversationKey({ conversationId }),
      )?.result?.conversation;
    },
    [queryClient],
  );
};

export { useGetDirectCastConversation };
