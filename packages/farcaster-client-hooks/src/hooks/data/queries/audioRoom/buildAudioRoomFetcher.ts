import { FarcasterApiClient } from 'farcaster-client-data';

const buildAudioRoomFetcher =
  ({ apiClient, roomId }: { apiClient: FarcasterApiClient; roomId: string }) =>
  async () => {
    const response = await apiClient.getAudioRoom({ roomId });
    return response.data.result.room;
  };

export { buildAudioRoomFetcher };
