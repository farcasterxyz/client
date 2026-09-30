import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDirectCastConversationFetcher } from './buildDirectCastConversationFetcher';
import { buildDirectCastConversationKey } from './buildDirectCastConversationKey';

const usePrefetchDirectCastConversation = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({ conversationId }: { conversationId: string }) => {
      return queryClient.prefetchQuery({
        queryKey: buildDirectCastConversationKey({ conversationId }),
        queryFn: buildDirectCastConversationFetcher({
          apiClient,
          conversationId,
        }),
      });
    },
    [apiClient, queryClient],
  );
};

export { usePrefetchDirectCastConversation };
