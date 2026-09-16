import {
  DEFAULT_TIMEOUT_DIRECT_CAST_CONVERSATION_RECENT_MESSAGES,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildDirectCastConversationRecentMessagesFetcher =
  ({
    apiClient,
    conversationId,
  }: {
    apiClient: FarcasterApiClient;
    conversationId: string;
  }) =>
  async () => {
    const response = await apiClient.getDirectCastConversationRecentMessages(
      {
        conversationId: conversationId,
      },
      { timeout: DEFAULT_TIMEOUT_DIRECT_CAST_CONVERSATION_RECENT_MESSAGES },
    );

    return response.data;
  };

export { buildDirectCastConversationRecentMessagesFetcher };
