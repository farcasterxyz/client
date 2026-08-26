import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildDirectCastConversationHistoricalMessagesFetcher } from './buildDirectCastConversationHistoricalMessagesFetcher';
import { buildDirectCastConversationHistoricalMessagesKey } from './buildDirectCastConversationHistoricalMessagesKey';
import { directCastConversationHistoricalMessagesDefaultQueryOptions } from './directCastConversationHistoricalMessagesDefaultQueryOptions';

const usePrefetchDirectCastConversationHistoricalMessages = () => {
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
      messageId: string;
      limit: number;
    }) => {
      const queryKey = buildDirectCastConversationHistoricalMessagesKey({
        conversationId,
        messageId,
      });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        ...directCastConversationHistoricalMessagesDefaultQueryOptions,
        initialPageParam: undefined,
        queryKey: queryKey,

        queryFn: buildDirectCastConversationHistoricalMessagesFetcher({
          apiClient,
          conversationId,
          messageId,
          limit: limit,
        }),
      });
    },
    [apiClient, checkIfRecentlyPrefetched, queryClient],
  );
};

export { usePrefetchDirectCastConversationHistoricalMessages };
