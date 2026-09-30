import {
  ApiGetDirectCastConversationMessages200Response,
  DEFAULT_TIMEOUT_DIRECT_CAST_CONVERSATION_MESSAGES,
  FarcasterApiClient,
  isHandledFetchError,
} from 'farcaster-client-data';

import { OnCreateFallback } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildDirectCastConversationMessagesFetcher = ({
  apiClient,
  conversationId,
  messageId,
  limit,
  onCreateFallback,
}: {
  apiClient: FarcasterApiClient;
  conversationId: string;
  messageId: string | undefined;
  limit?: number;
  onCreateFallback?: OnCreateFallback;
}) =>
  wrapPaginatedFetcher(async ({ pageParam }) => {
    const cursorLimit = limit ?? 15;

    try {
      const cursor = pageParam;

      const response = await apiClient.getDirectCastConversationMessages(
        {
          conversationId: conversationId,
          messageId: messageId,
          cursor: cursor,
          limit: cursorLimit,
        },
        { timeout: DEFAULT_TIMEOUT_DIRECT_CAST_CONVERSATION_MESSAGES },
      );

      return response.data;
    } catch (e) {
      if (
        isHandledFetchError(e) &&
        e?.response?.status === 403 &&
        typeof onCreateFallback !== 'undefined'
      ) {
        return {
          result: onCreateFallback,
        } satisfies ApiGetDirectCastConversationMessages200Response;
      }

      throw e;
    }
  });

export { buildDirectCastConversationMessagesFetcher };
