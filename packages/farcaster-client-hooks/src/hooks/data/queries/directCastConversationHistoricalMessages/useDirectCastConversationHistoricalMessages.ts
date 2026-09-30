import { useInfiniteQuery } from '@tanstack/react-query';
import { DirectCastsConversationMessagesCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDirectCastConversationHistoricalMessagesFetcher } from './buildDirectCastConversationHistoricalMessagesFetcher';
import { buildDirectCastConversationHistoricalMessagesKey } from './buildDirectCastConversationHistoricalMessagesKey';
import { directCastConversationHistoricalMessagesDefaultQueryOptions } from './directCastConversationHistoricalMessagesDefaultQueryOptions';

const useDirectCastConversationHistoricalMessages = ({
  conversationId,
  messageId,
  limit,
}: {
  conversationId: string;
  messageId: string | undefined;
  limit: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useInfiniteQuery({
    ...directCastConversationHistoricalMessagesDefaultQueryOptions,
    initialPageParam: undefined,
    queryKey: buildDirectCastConversationHistoricalMessagesKey({
      conversationId: conversationId,
      messageId: messageId,
    }),

    queryFn: buildDirectCastConversationHistoricalMessagesFetcher({
      apiClient,
      conversationId: conversationId,
      // @ts-expect-error Query is not enabled when message id is undefined
      messageId: messageId,
      limit: limit,
    }),

    enabled: typeof messageId !== 'undefined',
    throwOnError: false,

    getNextPageParam: ({ next }) => {
      if (next?.cursor) {
        const parsedReturnedCursor = JSON.parse(
          Buffer.from(next.cursor, 'base64').toString(),
        ) as DirectCastsConversationMessagesCursor;
        if (parsedReturnedCursor.before) {
          const cursor = Buffer.from(
            JSON.stringify({
              limit: parsedReturnedCursor.limit,
              page: parsedReturnedCursor.page,
              before: parsedReturnedCursor.before,
            } satisfies DirectCastsConversationMessagesCursor),
          )
            .toString('base64')
            .replaceAll(/=/g, '');
          return cursor;
        }
        return undefined;
      }
    },

    getPreviousPageParam: ({ next }) => {
      if (next?.cursor) {
        const parsedReturnedCursor = JSON.parse(
          Buffer.from(next.cursor, 'base64').toString(),
        ) as DirectCastsConversationMessagesCursor;
        if (parsedReturnedCursor.after) {
          const cursor = Buffer.from(
            JSON.stringify({
              limit: parsedReturnedCursor.limit,
              page: parsedReturnedCursor.page,
              after: parsedReturnedCursor.after,
            } satisfies DirectCastsConversationMessagesCursor),
          )
            .toString('base64')
            .replaceAll(/=/g, '');

          return cursor;
        }
        return undefined;
      }
    },
  });
};

export { useDirectCastConversationHistoricalMessages };
