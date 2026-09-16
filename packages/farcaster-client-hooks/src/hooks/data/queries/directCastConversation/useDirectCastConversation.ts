import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type {
  ApiDirectCastConversationInfoV3,
  FetchError,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDirectCastConversationFetcher } from './buildDirectCastConversationFetcher';
import { buildDirectCastConversationKey } from './buildDirectCastConversationKey';

/**
 * The conversation payload returned by `getDirectCastConversation`. Aliased
 * directly from the generated API type rather than derived from the fetcher's
 * return shape, so it stays readable and doesn't imply `result` is nullable —
 * the schema marks both `result` and `conversation` required.
 */
export type DirectCastConversation = ApiDirectCastConversationInfoV3;

/**
 * Fetches a direct cast conversation.
 *
 * @param conversationId - The ID of the conversation to fetch.
 * @param enabled - Whether the query should be enabled.
 * @param select - Optional narrowing of the conversation into the slice the
 *   caller actually needs. Returning a narrow value (e.g. a boolean) lets React
 *   Query compare the selected result between renders and skip re-rendering
 *   this subscriber when unrelated conversation fields change — useful for
 *   high-fanout subscribers like per-message cells that only read a single
 *   field.
 * @returns The conversation (or the selected slice) and its loading and error
 *   states.
 */
const useDirectCastConversation = <TData = DirectCastConversation | undefined>({
  conversationId,
  enabled = true,
  select,
}: {
  conversationId: string | undefined;
  enabled?: boolean;
  select?: (conversation: DirectCastConversation | undefined) => TData;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildDirectCastConversationKey({ conversationId }),

    queryFn: buildDirectCastConversationFetcher({
      apiClient,
      conversationId,
    }),

    // We are handling the no conversation found errors manually
    // so let's go ahead and allow bypassing throwing to error boundary.
    // All callers of this endpoint handle it with `isError` property.
    throwOnError: false,

    // Prevent retrying on 400 errors
    retry: (failureCount, error: Error) => {
      if (error && 'status' in error && (error as FetchError).status === 400)
        return false;
      return failureCount < 3;
    },

    enabled: !!conversationId && enabled,
    select: (data): TData => {
      const conversation = data.result?.conversation;
      // Only the identity fallback needs the assertion: TS can't prove
      // `conversation` is the generic TData for an arbitrary caller, though it
      // holds at the default TData (DirectCastConversation | undefined). A
      // caller-provided select is already typed to return TData.
      return select ? select(conversation) : (conversation as TData);
    },
  });
};

/**
 * Fetches a direct cast conversation.
 *
 * @param conversationId - The ID of the conversation to fetch.
 * @param enabled - Whether the query should be enabled.
 * @returns The conversation and its loading and error states.
 */
const useSuspenseDirectCastConversation = ({
  conversationId,
}: {
  conversationId: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildDirectCastConversationKey({ conversationId }),

    queryFn: buildDirectCastConversationFetcher({
      apiClient,
      conversationId,
    }),

    // Prevent retrying on 400 errors
    retry: (failureCount, error: Error) => {
      if (error && 'status' in error && (error as FetchError).status === 400)
        return false;
      return failureCount < 3;
    },

    select: (data) => data.result?.conversation,
  });
};

export { useDirectCastConversation, useSuspenseDirectCastConversation };
