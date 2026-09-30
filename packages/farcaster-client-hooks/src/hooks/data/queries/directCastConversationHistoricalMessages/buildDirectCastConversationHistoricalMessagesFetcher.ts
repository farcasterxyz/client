import { FarcasterApiClient } from 'farcaster-client-data';

const buildDirectCastConversationHistoricalMessagesFetcher =
  ({
    apiClient,
    conversationId,
    messageId,
    limit,
  }: {
    apiClient: FarcasterApiClient;
    conversationId: string;
    messageId: string;
    limit: number;
  }) =>
  async () => {
    const response = await apiClient.getDirectCastConversationMessages({
      conversationId: conversationId,
      messageId: messageId,
      limit: limit,
    });

    return response.data;
  };

export { buildDirectCastConversationHistoricalMessagesFetcher };
