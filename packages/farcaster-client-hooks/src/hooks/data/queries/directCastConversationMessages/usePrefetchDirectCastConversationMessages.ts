import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildDirectCastConversationMessagesFetcher } from './buildDirectCastConversationMessagesFetcher';
import { buildDirectCastConversationMessagesKey } from './buildDirectCastConversationMessagesKey';
import { directCastConversationMessagesDefaultQueryOptions } from './directCastConversationMessagesDefaultQueryOptions';

const usePrefetchDirectCastConversationMessages = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      conversationId,
      messageId,
      limit,
    }: {
      conversationId: string;
      messageId: string | undefined;
      limit?: number;
    }) => {
      const queryKey = buildDirectCastConversationMessagesKey({
        conversationId,
        messageId,
      });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        ...directCastConversationMessagesDefaultQueryOptions,
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildDirectCastConversationMessagesFetcher({
          apiClient,
          conversationId,
          messageId,
          limit,
        }),
      });
    },
    [apiClient, checkIfRecentlyPrefetched, queryClient],
  );
};

export { usePrefetchDirectCastConversationMessages };
