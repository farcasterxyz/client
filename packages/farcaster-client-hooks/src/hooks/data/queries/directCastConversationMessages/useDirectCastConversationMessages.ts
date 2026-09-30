import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import type { DirectCastsConversationMessagesCursor } from 'farcaster-client-data';
import * as React from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import type { OnCreateFallback } from '../../../../types';
import { buildDirectCastConversationMessagesFetcher } from './buildDirectCastConversationMessagesFetcher';
import { buildDirectCastConversationMessagesKey } from './buildDirectCastConversationMessagesKey';
import { directCastConversationMessagesDefaultQueryOptions } from './directCastConversationMessagesDefaultQueryOptions';

const useDirectCastConversationMessagesInfiniteQueryOptions = ({
  conversationId,
  messageId,
  limit,
  onCreateFallback,
}: {
  conversationId: string;
  messageId: string | undefined;
  limit?: number;
  onCreateFallback?: OnCreateFallback;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const queryKey = buildDirectCastConversationMessagesKey({
    conversationId: conversationId,
    messageId: messageId,
  });

  return React.useMemo(
    () => ({
      ...directCastConversationMessagesDefaultQueryOptions,
      queryKey,
      queryFn: buildDirectCastConversationMessagesFetcher({
        apiClient,
        conversationId: conversationId,
        messageId: messageId,
        limit,
        onCreateFallback,
      }),
      initialPageParam: undefined,
      getNextPageParam: ({
        next,
      }: {
        next?:
          | {
              cursor?: string | undefined;
            }
          | undefined;
      }) => {
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
      getPreviousPageParam: ({
        next,
      }: {
        next?:
          | {
              cursor?: string | undefined;
            }
          | undefined;
      }) => {
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
    }),
    [conversationId, messageId, limit, onCreateFallback, apiClient, queryKey],
  );
};

const useDirectCastConversationMessages = ({
  conversationId,
  messageId,
  limit,
  onCreateFallback,
}: {
  conversationId: string;
  messageId: string | undefined;
  limit?: number;
  onCreateFallback?: OnCreateFallback;
}) => {
  const infiniteQueryOptions =
    useDirectCastConversationMessagesInfiniteQueryOptions({
      conversationId,
      messageId,
      limit,
      onCreateFallback,
    });
  return useInfiniteQuery(infiniteQueryOptions);
};

const useSuspenseDirectCastConversationMessages = ({
  conversationId,
  messageId,
  limit,
  onCreateFallback,
}: {
  conversationId: string;
  messageId: string | undefined;
  limit?: number;
  onCreateFallback?: OnCreateFallback;
}) => {
  const infiniteQueryOptions =
    useDirectCastConversationMessagesInfiniteQueryOptions({
      conversationId,
      messageId,
      limit,
      onCreateFallback,
    });
  return useSuspenseInfiniteQuery(infiniteQueryOptions);
};

export {
  useDirectCastConversationMessages,
  useSuspenseDirectCastConversationMessages,
};
