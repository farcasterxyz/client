import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildDirectCastConversationRecentMessagesFetcher } from './buildDirectCastConversationRecentMessagesFetcher';
import { buildDirectCastConversationRecentMessagesKey } from './buildDirectCastConversationRecentMessagesKey';
import { directCastConversationRecentMessagesDefaultQueryOptions } from './directCastConversationRecentMessagesDefaultQueryOptions';

const usePrefetchDirectCastConversationRecentMessages = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({ conversationId }: { conversationId: string }) => {
      const queryKey = buildDirectCastConversationRecentMessagesKey({
        conversationId,
      });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchQuery({
        ...directCastConversationRecentMessagesDefaultQueryOptions,
        queryKey: queryKey,

        queryFn: buildDirectCastConversationRecentMessagesFetcher({
          apiClient,
          conversationId,
        }),
      });
    },
    [apiClient, checkIfRecentlyPrefetched, queryClient],
  );
};

export { usePrefetchDirectCastConversationRecentMessages };
