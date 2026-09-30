import { FarcasterApiClient } from 'farcaster-client-data';

const buildScheduledAudioRoomsListFetcher =
  ({ apiClient, limit }: { apiClient: FarcasterApiClient; limit?: number }) =>
  async () => {
    const response = await apiClient.listScheduledAudioRooms({ limit });
    return response.data.result.rooms;
  };

export { buildScheduledAudioRoomsListFetcher };
