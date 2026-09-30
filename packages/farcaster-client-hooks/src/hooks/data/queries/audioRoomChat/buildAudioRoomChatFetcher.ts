import { FarcasterApiClient } from 'farcaster-client-data';

const buildAudioRoomChatFetcher =
  ({
    apiClient,
    roomId,
    limit,
  }: {
    apiClient: FarcasterApiClient;
    roomId: string;
    limit?: number;
  }) =>
  async () => {
    const response = await apiClient.getAudioRoomChat({ roomId, limit });
    return response.data;
  };

export { buildAudioRoomChatFetcher };
