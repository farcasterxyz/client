import { FarcasterApiClient } from 'farcaster-client-data';

const buildAudioRoomsListFetcher =
  ({ apiClient, limit }: { apiClient: FarcasterApiClient; limit?: number }) =>
  async () => {
    const response = await apiClient.listLiveAudioRooms({ limit });
    return response.data.result.rooms;
  };

export { buildAudioRoomsListFetcher };
