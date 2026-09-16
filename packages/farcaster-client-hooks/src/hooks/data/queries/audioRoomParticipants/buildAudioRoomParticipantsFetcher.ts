import { FarcasterApiClient } from 'farcaster-client-data';

const buildAudioRoomParticipantsFetcher =
  ({
    apiClient,
    roomId,
    includePast = false,
  }: {
    apiClient: FarcasterApiClient;
    roomId: string;
    includePast?: boolean;
  }) =>
  async () => {
    const response = await apiClient.listAudioRoomParticipants({
      roomId,
      includePast,
    });
    return response.data.result.participants;
  };

export { buildAudioRoomParticipantsFetcher };
