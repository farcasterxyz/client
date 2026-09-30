import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildPlaintextDirectCastReactionsFetcher = ({
  apiClient,
  conversationId,
  messageId,
}: {
  apiClient: FarcasterApiClient;
  conversationId: string;
  messageId: string;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getDirectCastConversationReactionsV3({
      conversationId: conversationId,
      messageId: messageId,
      cursor: cursor,
      limit: 100,
    });

    return response.data;
  });

export { buildPlaintextDirectCastReactionsFetcher };
