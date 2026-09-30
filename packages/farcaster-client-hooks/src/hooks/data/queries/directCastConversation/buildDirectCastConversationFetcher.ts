import {
  DEFAULT_TIMEOUT_DIRECT_CAST_CONVERSATION,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildDirectCastConversationFetcher =
  ({
    apiClient,
    conversationId,
  }: {
    apiClient: FarcasterApiClient;
    conversationId: string | undefined;
  }) =>
  async () => {
    if (!conversationId) {
      throw new Error('attempting to query for falsey conversationId');
    }
    const response = await apiClient.getDirectCastConversation(
      {
        conversationId,
      },
      { timeout: DEFAULT_TIMEOUT_DIRECT_CAST_CONVERSATION },
    );
    return response.data;
  };

export { buildDirectCastConversationFetcher };
